/**
 * Structured metadata parsed from Doxygen / Javadoc documentation blocks.
 */
export interface DoxygenParsedDoc {
  brief: string;
  params: Map<string, string>;
  tparams: Map<string, string>;
  returns?: string;
  notes: string[];
  warnings: string[];
  deprecated?: string;
  throws: string[];
  see: string[];
}

/**
 * Parses Doxygen documentation comments into structured metadata.
 * Supports standard tags (@param, @tparam, @return/@returns, @brief, @note, @warning, @deprecated, @throws/@throw, @see/@sa)
 * as well as backslash tag prefixes (\param, \tparam, \note, etc.).
 */
export function parseDoxygen(text: string): DoxygenParsedDoc {
  const params = new Map<string, string>();
  const tparams = new Map<string, string>();
  const notes: string[] = [];
  const warnings: string[] = [];
  const throws: string[] = [];
  const see: string[] = [];
  let brief = '';
  let returns: string | undefined;
  let deprecated: string | undefined;

  if (!text) {
    return { brief, params, tparams, returns, notes, warnings, deprecated, throws, see };
  }

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    // Strip leading comment characters: ///, //!, /**, *, #
    const line = rawLine.replace(/^\s*(?:\/\/[/!]?|\/\*+|\*+|\*\/)\s?/, '').trim();
    if (!line) continue;

    // 1. Template parameters: @tparam <name> <description> or \tparam <name> <description>
    const tparamMatch = line.match(/^[@\\]tparam\s+([a-zA-Z0-9_]+)\s+(.+)/);
    if (tparamMatch) {
      tparams.set(tparamMatch[1], tparamMatch[2].trim());
      continue;
    }

    // 2. Function parameters: @param[in/out] <name> <description> or \param <name> <description>
    const paramMatch = line.match(/^[@\\]param(?:\s*\[[^\]]+\])?\s+([a-zA-Z0-9_]+)\s+(.+)/);
    if (paramMatch) {
      params.set(paramMatch[1], paramMatch[2].trim());
      continue;
    }

    // 3. Return values: @return or @returns or \return or \returns
    const returnMatch = line.match(/^[@\\]returns?\s+(.+)/);
    if (returnMatch) {
      returns = returnMatch[1].trim();
      continue;
    }

    // 4. Brief description: @brief or \brief
    const briefMatch = line.match(/^[@\\]brief\s+(.+)/);
    if (briefMatch) {
      brief = briefMatch[1].trim();
      continue;
    }

    // 5. Notes: @note or \note
    const noteMatch = line.match(/^[@\\]note\s+(.+)/);
    if (noteMatch) {
      notes.push(noteMatch[1].trim());
      continue;
    }

    // 6. Warnings: @warning or \warning
    const warningMatch = line.match(/^[@\\]warning\s+(.+)/);
    if (warningMatch) {
      warnings.push(warningMatch[1].trim());
      continue;
    }

    // 7. Deprecation: @deprecated or \deprecated
    const depMatch = line.match(/^[@\\]deprecated(?:\s+(.+))?/);
    if (depMatch) {
      deprecated = depMatch[1]?.trim() || 'This API is deprecated.';
      continue;
    }

    // 8. Exceptions: @throws or @throw or \throws or \throw or @exception
    const throwsMatch = line.match(/^[@\\](?:throws?|exception)\s+(.+)/);
    if (throwsMatch) {
      throws.push(throwsMatch[1].trim());
      continue;
    }

    // 9. See also: @see or @sa or \see or \sa
    const seeMatch = line.match(/^[@\\](?:see|sa)\s+(.+)/);
    if (seeMatch) {
      see.push(seeMatch[1].trim());
      continue;
    }

    // Default: first non-empty line without a tag is the brief summary
    if (!brief && !line.startsWith('@') && !line.startsWith('\\')) {
      brief = line;
    }
  }

  return { brief, params, tparams, returns, notes, warnings, deprecated, throws, see };
}
