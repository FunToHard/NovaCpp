import * as path from 'path';
import * as fs from 'fs';
import {
  SolutionModel,
  SolutionConfiguration,
  SolutionProjectEntry,
  VcxProjectModel,
  ProjectCompileOptions,
  ProjectReferenceEntry
} from './solution-models';

/**
 * Decodes standard XML entity references (&quot;, &apos;, &lt;, &gt;, &amp;).
 * Entity &amp; is intentionally replaced last to avoid double-unescaping.
 */
export function decodeXmlEntities(s: string): string {
  if (!s || !s.includes('&')) return s;
  return s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Normalizes Visual Studio LanguageStandard values (e.g. stdcpp20, stdcpplatest)
 * into standard C++ compiler flags (e.g. c++20, c++23).
 */
export function normalizeLanguageStandard(std?: string): string {
  if (!std) return 'c++20';
  const lower = std.toLowerCase().trim();
  if (lower.includes('latest') || lower.includes('23')) {
    return 'c++23';
  }
  if (lower.includes('20')) {
    return 'c++20';
  }
  if (lower.includes('17')) {
    return 'c++17';
  }
  if (lower.includes('14')) {
    return 'c++14';
  }
  return 'c++20';
}

/**
 * Parses traditional Visual Studio solution (.sln) files.
 */
export function parseSln(content: string, filePath: string): SolutionModel {
  const solutionDir = path.dirname(filePath);
  const solutionName = path.basename(filePath, path.extname(filePath));
  const projects: SolutionProjectEntry[] = [];
  const configurations: SolutionConfiguration[] = [];

  // Match Project definitions:
  // Project("{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}") = "ProjectName", "RelativePath.vcxproj", "{PROJECT_GUID}"
  const projectRegex =
    /Project\("(?<typeGuid>[^"]+)"\)\s*=\s*"(?<name>[^"]+)"\s*,\s*"(?<relPath>[^"]+)"\s*,\s*"(?<guid>[^"]+)"/g;

  let pMatch: RegExpExecArray | null;
  while ((pMatch = projectRegex.exec(content)) !== null) {
    const groups = pMatch.groups;
    if (!groups) continue;

    const relPath = groups.relPath.replace(/\\/g, '/');
    const ext = path.extname(relPath).toLowerCase();

    // Only process C++ projects (.vcxproj)
    if (ext === '.vcxproj') {
      const fullPath = path.resolve(solutionDir, relPath);
      projects.push({
        name: groups.name.trim(),
        relativePath: relPath,
        fullPath,
        guid: groups.guid.trim()
      });
    }
  }

  // Match SolutionConfigurationPlatforms:
  // GlobalSection(SolutionConfigurationPlatforms) = preSolution
  //     Debug|x64 = Debug|x64
  //     Release|x64 = Release|x64
  // EndGlobalSection
  const configSectionMatch = content.match(
    /GlobalSection\(SolutionConfigurationPlatforms\)\s*=\s*preSolution([\s\S]*?)EndGlobalSection/
  );

  if (configSectionMatch) {
    const lines = configSectionMatch[1].split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.includes('=')) continue;
      const key = line.split('=')[0].trim();
      const parts = key.split('|');
      if (parts.length === 2) {
        configurations.push({
          configuration: parts[0].trim(),
          platform: parts[1].trim(),
          key
        });
      }
    }
  }

  // Fallback configurations if not defined
  if (configurations.length === 0) {
    configurations.push(
      { configuration: 'Debug', platform: 'x64', key: 'Debug|x64' },
      { configuration: 'Release', platform: 'x64', key: 'Release|x64' }
    );
  }

  return {
    format: 'sln',
    filePath,
    name: solutionName,
    configurations,
    projects
  };
}

/**
 * Parses modern Visual Studio XML solution (.slnx) files.
 */
export function parseSlnx(content: string, filePath: string): SolutionModel {
  const solutionDir = path.dirname(filePath);
  const solutionName = path.basename(filePath, path.extname(filePath));
  const projects: SolutionProjectEntry[] = [];
  const configurations: SolutionConfiguration[] = [];

  // Strip XML comments
  const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '');

  // 1. Extract configurations
  const configNames: string[] = [];
  const platformNames: string[] = [];

  const configRegex = /<Configuration\s+Name="([^"]+)"/g;
  let cMatch: RegExpExecArray | null;
  while ((cMatch = configRegex.exec(cleanContent)) !== null) {
    configNames.push(decodeXmlEntities(cMatch[1].trim()));
  }

  const platformRegex = /<Platform\s+Name="([^"]+)"/g;
  let plMatch: RegExpExecArray | null;
  while ((plMatch = platformRegex.exec(cleanContent)) !== null) {
    platformNames.push(decodeXmlEntities(plMatch[1].trim()));
  }

  if (configNames.length > 0 && platformNames.length > 0) {
    for (const conf of configNames) {
      for (const plat of platformNames) {
        configurations.push({
          configuration: conf,
          platform: plat,
          key: `${conf}|${plat}`
        });
      }
    }
  }

  // Also check for composite configuration entries: <Configuration Solution="Debug|x64" ... />
  const compositeRegex = /<Configuration\s+Solution="([^"]+)"/g;
  let compMatch: RegExpExecArray | null;
  while ((compMatch = compositeRegex.exec(cleanContent)) !== null) {
    const key = decodeXmlEntities(compMatch[1].trim());
    const parts = key.split('|');
    if (parts.length === 2 && !configurations.some((c) => c.key === key)) {
      configurations.push({
        configuration: parts[0],
        platform: parts[1],
        key
      });
    }
  }

  // Default fallback configurations
  if (configurations.length === 0) {
    configurations.push(
      { configuration: 'Debug', platform: 'x64', key: 'Debug|x64' },
      { configuration: 'Release', platform: 'x64', key: 'Release|x64' }
    );
  }

  // 2. Extract projects: <Project Path="path/to/project.vcxproj" [Id="..."] />
  const projectTagRegex = /<Project\b([^>]+)\/?>/g;
  let projTagMatch: RegExpExecArray | null;
  while ((projTagMatch = projectTagRegex.exec(cleanContent)) !== null) {
    const attrs = projTagMatch[1];
    const pathMatch = attrs.match(/Path="([^"]+)"/);
    if (!pathMatch) continue;

    let relPath = decodeXmlEntities(pathMatch[1].trim());
    if (relPath.startsWith('"') && relPath.endsWith('"')) {
      relPath = relPath.slice(1, -1).trim();
    }
    relPath = relPath.replace(/\\/g, '/');
    if (relPath.toLowerCase().endsWith('.vcxproj')) {
      const idMatch = attrs.match(/Id="([^"]+)"/);
      const name = path.basename(relPath, path.extname(relPath));
      const fullPath = path.resolve(solutionDir, relPath);

      projects.push({
        name,
        relativePath: relPath,
        fullPath,
        guid: idMatch ? decodeXmlEntities(idMatch[1].trim()) : undefined
      });
    }
  }

  return {
    format: 'slnx',
    filePath,
    name: solutionName,
    configurations,
    projects
  };
}

/**
 * Parses MSBuild C++ project files (.vcxproj).
 */
export function parseVcxproj(content: string, filePath: string, solutionDir?: string): VcxProjectModel {
  const projectDir = path.dirname(filePath);
  const effectiveSolutionDir = solutionDir ?? path.dirname(projectDir);
  const projectName = path.basename(filePath, path.extname(filePath));

  // Strip XML comments
  const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '');

  // Extract GUID
  const guidMatch = cleanContent.match(/<ProjectGuid>([^<]+)<\/ProjectGuid>/i);
  const guid = guidMatch ? decodeXmlEntities(guidMatch[1].trim()) : undefined;

  // Extract ConfigurationType (Application, DynamicLibrary, StaticLibrary)
  const typeMatch = cleanContent.match(/<ConfigurationType>([^<]+)<\/ConfigurationType>/i);
  const configurationType = typeMatch ? decodeXmlEntities(typeMatch[1].trim()) : 'Application';

  // Extract TargetName and OutDir
  const targetNameMatch = cleanContent.match(/<TargetName>([^<]+)<\/TargetName>/i);
  const targetName = targetNameMatch ? decodeXmlEntities(targetNameMatch[1].trim()) : projectName;

  const outDirMatch = cleanContent.match(/<OutDir>([^<]+)<\/OutDir>/i);
  const rawOutDir = outDirMatch ? decodeXmlEntities(outDirMatch[1].trim()) : undefined;
  const outDir = rawOutDir
    ? rawOutDir
        .replace(/\$\(ProjectDir\)/gi, projectDir + path.sep)
        .replace(/\$\(SolutionDir\)/gi, effectiveSolutionDir + path.sep)
    : undefined;

  // Extract ProjectConfigurations
  const configurations: SolutionConfiguration[] = [];
  const projectConfigRegex =
    /<ProjectConfiguration\s+Include="([^"]+)">[\s\S]*?<Configuration>([^<]+)<\/Configuration>[\s\S]*?<Platform>([^<]+)<\/Platform>/g;

  let pcMatch: RegExpExecArray | null;
  while ((pcMatch = projectConfigRegex.exec(cleanContent)) !== null) {
    configurations.push({
      key: decodeXmlEntities(pcMatch[1].trim()),
      configuration: decodeXmlEntities(pcMatch[2].trim()),
      platform: decodeXmlEntities(pcMatch[3].trim())
    });
  }

  // Extract ClCompile sources
  const sourceFiles: string[] = [];
  const seenSourceFiles = new Set<string>();
  const clCompileRegex = /<ClCompile\s+Include="([^"]+)"/g;
  let clMatch: RegExpExecArray | null;
  while ((clMatch = clCompileRegex.exec(cleanContent)) !== null) {
    let rawFile = decodeXmlEntities(clMatch[1].trim());
    if (rawFile.startsWith('"') && rawFile.endsWith('"')) {
      rawFile = rawFile.slice(1, -1).trim();
    }
    const fullPath = path.resolve(projectDir, rawFile.replace(/\\/g, '/'));
    if (!seenSourceFiles.has(fullPath)) {
      seenSourceFiles.add(fullPath);
      sourceFiles.push(fullPath);
    }
  }

  // Extract ClInclude headers
  const headerFiles: string[] = [];
  const seenHeaderFiles = new Set<string>();
  const clIncludeRegex = /<ClInclude\s+Include="([^"]+)"/g;
  let hMatch: RegExpExecArray | null;
  while ((hMatch = clIncludeRegex.exec(cleanContent)) !== null) {
    let rawFile = decodeXmlEntities(hMatch[1].trim());
    if (rawFile.startsWith('"') && rawFile.endsWith('"')) {
      rawFile = rawFile.slice(1, -1).trim();
    }
    const fullPath = path.resolve(projectDir, rawFile.replace(/\\/g, '/'));
    if (!seenHeaderFiles.has(fullPath)) {
      seenHeaderFiles.add(fullPath);
      headerFiles.push(fullPath);
    }
  }

  // Extract ProjectReferences
  const projectReferences: ProjectReferenceEntry[] = [];
  const projRefRegex = /<ProjectReference\s+Include=["']([^"']+)["'](?:\s*\/>|>([\s\S]*?)<\/ProjectReference>)/gi;
  let prMatch: RegExpExecArray | null;
  while ((prMatch = projRefRegex.exec(cleanContent)) !== null) {
    let rawRef = decodeXmlEntities(prMatch[1].trim());
    if (rawRef.startsWith('"') && rawRef.endsWith('"')) {
      rawRef = rawRef.slice(1, -1).trim();
    }
    const fullPath = path.resolve(projectDir, rawRef.replace(/\\/g, '/'));
    const innerContent = prMatch[2] || '';
    const refGuidMatch = innerContent.match(/<Project>([^<]+)<\/Project>/i);
    const refGuid = refGuidMatch ? decodeXmlEntities(refGuidMatch[1].trim()) : undefined;

    projectReferences.push({
      relativePath: rawRef.replace(/\\/g, '/'),
      fullPath: fullPath.replace(/\\/g, '/'),
      projectGuid: refGuid
    });
  }

  // Parse ItemDefinitionGroup blocks
  const compileOptionsByConfig = new Map<string, ProjectCompileOptions>();
  let defaultCompileOptions: ProjectCompileOptions = {
    includeDirectories: [],
    preprocessorDefinitions: [],
    languageStandard: 'c++20',
    additionalOptions: []
  };

  const itemDefRegex = /<ItemDefinitionGroup(?:\s+Condition="([^"]+)")?>([\s\S]*?)<\/ItemDefinitionGroup>/g;
  let idMatch: RegExpExecArray | null;

  while ((idMatch = itemDefRegex.exec(cleanContent)) !== null) {
    const condition = idMatch[1];
    const body = idMatch[2];

    const clCompileBlockMatch = body.match(/<ClCompile>([\s\S]*?)<\/ClCompile>/);
    if (!clCompileBlockMatch) continue;

    const clBody = clCompileBlockMatch[1];

    // LanguageStandard
    const stdMatch = clBody.match(/<LanguageStandard>([^<]+)<\/LanguageStandard>/i);
    const standard = normalizeLanguageStandard(stdMatch ? decodeXmlEntities(stdMatch[1]) : undefined);

    // AdditionalIncludeDirectories
    const incMatch = clBody.match(/<AdditionalIncludeDirectories>([^<]+)<\/AdditionalIncludeDirectories>/i);
    const includeDirectories: string[] = [];
    if (incMatch) {
      const decodedIncs = decodeXmlEntities(incMatch[1]);
      const rawIncs = decodedIncs.split(';');
      for (const inc of rawIncs) {
        let trimmed = inc.trim();
        if (!trimmed || trimmed.includes('%(AdditionalIncludeDirectories)')) continue;
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          trimmed = trimmed.slice(1, -1).trim();
        }
        // Expand MSBuild macros
        trimmed = trimmed
          .replace(/\$\(ProjectDir\)/gi, projectDir + path.sep)
          .replace(/\$\(SolutionDir\)/gi, effectiveSolutionDir + path.sep);
        const normalized = trimmed.replace(/\\/g, '/');
        const absPath = path.isAbsolute(normalized)
          ? normalized
          : path.resolve(projectDir, normalized);
        if (!includeDirectories.includes(absPath)) {
          includeDirectories.push(absPath);
        }
      }
    }

    // PreprocessorDefinitions
    const defMatch = clBody.match(/<PreprocessorDefinitions>([^<]+)<\/PreprocessorDefinitions>/i);
    const preprocessorDefinitions: string[] = [];
    if (defMatch) {
      const decodedDefs = decodeXmlEntities(defMatch[1]);
      const rawDefs = decodedDefs.split(';');
      for (const def of rawDefs) {
        const trimmed = def.trim();
        if (!trimmed || trimmed.includes('%(PreprocessorDefinitions)')) continue;
        preprocessorDefinitions.push(trimmed);
      }
    }

    // AdditionalOptions
    const optMatch = clBody.match(/<AdditionalOptions>([^<]+)<\/AdditionalOptions>/i);
    const additionalOptions: string[] = [];
    if (optMatch) {
      const decodedOpts = decodeXmlEntities(optMatch[1]);
      const rawOpts = decodedOpts.trim().split(/\s+/);
      for (const opt of rawOpts) {
        if (!opt || opt.includes('%(AdditionalOptions)')) continue;
        additionalOptions.push(opt);
      }
    }

    const options: ProjectCompileOptions = {
      includeDirectories,
      preprocessorDefinitions,
      languageStandard: standard,
      additionalOptions,
      configurationType: configurationType as any
    };

    if (condition) {
      // Condition="'$(Configuration)|$(Platform)'=='Debug|x64'"
      const decodedCond = decodeXmlEntities(condition);
      const condMatch = decodedCond.match(/==\s*'([^']+)'/);
      if (condMatch) {
        const configKey = condMatch[1].trim();
        // Merge with defaultCompileOptions
        const merged: ProjectCompileOptions = {
          includeDirectories: [
            ...defaultCompileOptions.includeDirectories,
            ...options.includeDirectories.filter(
              (d) => !defaultCompileOptions.includeDirectories.includes(d)
            )
          ],
          preprocessorDefinitions: [
            ...defaultCompileOptions.preprocessorDefinitions,
            ...options.preprocessorDefinitions.filter(
              (d) => !defaultCompileOptions.preprocessorDefinitions.includes(d)
            )
          ],
          languageStandard: options.languageStandard || defaultCompileOptions.languageStandard,
          additionalOptions: [
            ...(defaultCompileOptions.additionalOptions ?? []),
            ...(options.additionalOptions ?? [])
          ],
          configurationType: options.configurationType ?? defaultCompileOptions.configurationType
        };
        compileOptionsByConfig.set(configKey, merged);
      }
    } else {
      defaultCompileOptions = options;
      // Merge into already parsed conditional options
      for (const [key, existing] of compileOptionsByConfig.entries()) {
        compileOptionsByConfig.set(key, {
          includeDirectories: [
            ...options.includeDirectories,
            ...existing.includeDirectories.filter((d) => !options.includeDirectories.includes(d))
          ],
          preprocessorDefinitions: [
            ...options.preprocessorDefinitions,
            ...existing.preprocessorDefinitions.filter((d) => !options.preprocessorDefinitions.includes(d))
          ],
          languageStandard: existing.languageStandard || options.languageStandard,
          additionalOptions: [
            ...(options.additionalOptions ?? []),
            ...(existing.additionalOptions ?? [])
          ],
          configurationType: existing.configurationType ?? options.configurationType
        });
      }
    }
  }

  return {
    filePath,
    name: projectName,
    guid,
    configurationType,
    configurations,
    compileOptionsByConfig,
    defaultCompileOptions,
    sourceFiles,
    headerFiles,
    targetName,
    outDir,
    projectReferences
  };
}

/**
 * Reads a text file safely handling UTF-16 LE, UTF-16 BE, and UTF-8 BOM encodings.
 */
export async function readFileWithEncoding(filePath: string): Promise<string> {
  const buffer = await fs.promises.readFile(filePath);
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }
  if (buffer.length >= 4 && buffer[1] === 0x00 && buffer[3] === 0x00) {
    return buffer.toString('utf16le');
  }
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf8');
  }
  return buffer.toString('utf8');
}

/**
 * Loads and parses a .sln or .slnx solution file from disk.
 */
export async function parseSolutionFile(filePath: string): Promise<SolutionModel | null> {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = await readFileWithEncoding(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.slnx') {
      return parseSlnx(content, filePath);
    } else if (ext === '.sln') {
      return parseSln(content, filePath);
    }
    return null;
  } catch (err) {
    console.warn(`NovaCpp: Failed to parse solution file at ${filePath}:`, err);
    return null;
  }
}

/**
 * Loads and parses a .vcxproj project file from disk.
 */
export async function loadVcxProject(filePath: string, solutionDir?: string): Promise<VcxProjectModel | null> {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = await readFileWithEncoding(filePath);
    return parseVcxproj(content, filePath, solutionDir);
  } catch (err) {
    console.warn(`NovaCpp: Failed to parse vcxproj at ${filePath}:`, err);
    return null;
  }
}

/**
 * Resolves transitive project references (DAG) for a project among all available projects.
 * Returns referenced projects in dependency order without cycles.
 */
export function resolveProjectReferenceDAG(
  project: VcxProjectModel,
  allProjects: VcxProjectModel[]
): VcxProjectModel[] {
  const mapByPath = new Map<string, VcxProjectModel>();
  const mapByGuid = new Map<string, VcxProjectModel>();

  for (const p of allProjects) {
    mapByPath.set(p.filePath.replace(/\\/g, '/').toLowerCase(), p);
    if (p.guid) {
      mapByGuid.set(p.guid.toLowerCase(), p);
    }
  }

  const result: VcxProjectModel[] = [];
  const visited = new Set<string>();

  function traverse(current: VcxProjectModel) {
    if (!current.projectReferences) return;
    for (const ref of current.projectReferences) {
      const refPathNorm = ref.fullPath.replace(/\\/g, '/').toLowerCase();
      let targetProj = mapByPath.get(refPathNorm);
      if (!targetProj && ref.projectGuid) {
        targetProj = mapByGuid.get(ref.projectGuid.toLowerCase());
      }
      if (targetProj) {
        const targetPathNorm = targetProj.filePath.replace(/\\/g, '/').toLowerCase();
        if (!visited.has(targetPathNorm)) {
          visited.add(targetPathNorm);
          traverse(targetProj);
          result.push(targetProj);
        }
      }
    }
  }

  traverse(project);
  return result;
}

/**
 * Propagates include directories from referenced projects across the project DAG into each project's compile options.
 */
export function propagateProjectReferences(
  projects: VcxProjectModel[],
  targetConfig?: string
): void {
  for (const project of projects) {
    const refProjects = resolveProjectReferenceDAG(project, projects);
    if (refProjects.length === 0) continue;

    const extraIncs: string[] = [];
    for (const ref of refProjects) {
      const refDir = path.dirname(ref.filePath).replace(/\\/g, '/');
      extraIncs.push(refDir);
      const refOpts = targetConfig
        ? ref.compileOptionsByConfig.get(targetConfig) || ref.defaultCompileOptions
        : ref.defaultCompileOptions;
      for (const inc of refOpts.includeDirectories) {
        extraIncs.push(inc.replace(/\\/g, '/'));
      }
    }

    // Merge into defaultCompileOptions
    for (const inc of extraIncs) {
      if (!project.defaultCompileOptions.includeDirectories.includes(inc)) {
        project.defaultCompileOptions.includeDirectories.push(inc);
      }
    }

    // Merge into compileOptionsByConfig
    for (const [, opts] of project.compileOptionsByConfig.entries()) {
      for (const inc of extraIncs) {
        if (!opts.includeDirectories.includes(inc)) {
          opts.includeDirectories.push(inc);
        }
      }
    }
  }
}

