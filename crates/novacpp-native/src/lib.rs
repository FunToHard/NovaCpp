pub mod cmake;
pub mod solution;
pub mod time_trace;

use napi_derive::napi;
pub use cmake::*;
pub use solution::*;
pub use time_trace::*;

#[napi]
pub fn get_native_engine_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
