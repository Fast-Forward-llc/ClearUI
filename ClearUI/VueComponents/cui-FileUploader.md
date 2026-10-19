# <cui-file-uploader>

A file input that uploads the selected file(s) to a web server using `fetch` and `FormData`. Supports optional **chunked uploads** for large files.

## Usage

```vue
<cui-file-uploader
  url="/api/upload"
  name="file"
  v-model="response"
  :qparams="{ folder: 'docs' }"
  :headers="{ 'X-Custom': 'value' }"
  :body="{ description: 'My file' }"
  v-on:error="handleError"
  v-slot="{ isActive, error, files, progress, cancel, reset }">
  <div v-if="isActive">Uploading... {{ progress }}%</div>
</cui-file-uploader>
```

### Chunked upload

```vue
<cui-file-uploader
  url="/api/upload"
  :chunk-size="1048576"
  :chunk-retries="3"
  :file-concurrency="2"
  v-model="response"
  v-slot="{ isActive, progress, cancel }">
  <progress v-if="isActive" :value="progress" max="100"></progress>
  <button v-if="isActive" type="button" v-on:click="cancel">Cancel</button>
</cui-file-uploader>
```

## Props

| Name            | Type              | Default         | Description |
|-----------------|-------------------|-----------------|-------------|
| id              | Any               | —               | Id for the file input. |
| modelValue      | Any               | —               | v-model value; receives the server response. |
| name            | String            | `'file'`        | Form field name for the file content. Additional attributes are passed to the `<input>`. |
| url             | String (required) | —               | Upload endpoint. |
| qparams         | Object            | `{}`            | Query string parameters. Sent with every request/chunk. |
| headers         | Object            | `{}`            | HTTP headers. Sent with every request/chunk. |
| credentials     | String            | `'same-origin'` | `same-origin`, `include` or `omit`. |
| body            | String/Object     | `null`          | Extra data sent as the `data` form field (JSON when `bodyFormat` is `json`). Sent with every chunk. |
| bodyFormat      | String            | `'json'`        | `json` serializes `body` with `JSON.stringify`; otherwise sent as-is. |
| disabled        | Boolean           | `false`         | Disables selecting and uploading. |
| triggerOn       | Any               | —               | When set, the upload does not start on selection; it starts when this changes to a truthy value. |
| reset           | Any               | —               | Changing to a truthy value clears the selection, aborts any upload and resets state. |
| chunkSize       | Number            | `null`          | Chunk size in bytes. When not null and greater than 0, chunked mode is used. |
| chunkRetries    | Number            | `3`             | Retries per chunk (exponential backoff starting at 500 ms) before the upload fails. |
| continueOnError | Boolean           | `false`         | Applies to per-file unchunked and chunked uploads. `false`: the first failed file aborts all other uploads and emits `error`. `true`: a failed file does not stop the others; failures are reported only through `file-error` and `error` is not emitted. |
| fileConcurrency | Number            | `1`             | Maximum number of files uploaded concurrently. `>= 1`: one request per file (chunked or not), up to this many at once. `<= 0`: unchunked mode sends all files in a single FormData request (ignored in chunked mode, where it is treated as 1). Chunks of a single file are always sent sequentially. |

## Events

| Event Name         | Payload | Description |
|--------------------|---------|-------------|
| update:model-value | value   | Server response. Single-request mode: the response to the one request. Per-file and chunked modes: the response for the file (one file) or an array of responses in file order (multiple files); in chunked mode each is the last chunk response. Only successful files are included (see Multi-file error handling). |
| response           | value   | Same payload as `update:model-value`. |
| file-uploaded      | Object  | Per-file and chunked modes: `{ file, fileName, index, response }` as each file completes successfully. |
| file-error         | Object  | Per-file and chunked modes: `{ file, fileName, index, error }` when a file fails (after chunk retries are exhausted). Emitted before `error` when `continueOnError` is `false`. |
| update:is-active   | Boolean | Emitted when the upload completes. |
| update:reset       | Boolean | Emitted when reset. |
| change             | File[]  | Files selected. |
| error              | String  | Upload failed or no file selected. `null` on reset. |
| begin-request      | —       | Upload started. |
| end-request        | —       | Upload ended (success, error or cancel). |
| progress           | Number  | Overall progress 0-100. Chunked mode: based on completed chunks. Unchunked per-file mode (`fileConcurrency >= 1`): based on completed files. Not emitted in single-request mode. |
| chunk-uploaded     | Object  | Chunked mode: `{ fileName, uploadId, chunkIndex, totalChunks, response }` after each chunk. |
| cancel             | —       | Upload cancelled via the slot `cancel` function. |

## Slot properties

| Name     | Description |
|----------|-------------|
| isActive | `true` while uploading. |
| error    | Current error message or `null`. |
| files    | Selected files. |
| progress | 0-100 (chunked mode, or unchunked per-file mode). Stays 0 in single-request mode. |
| cancel   | Function that aborts the current upload. |
| reset    | Function that clears the selection and state. |

## Standard (non-chunked) request

Unchunked uploads (`chunkSize` not set) have two behaviors, selected by `fileConcurrency`:

**Single request (`fileConcurrency <= 0`)** - one `POST` multipart/form-data containing the `data` field (when `body` is set) and every selected file under the field named by `name`. The response must be JSON and is emitted as-is.

**One request per file (`fileConcurrency >= 1`, the default)** - one `POST` per file, each containing the `data` field (when `body` is set) and that file under the field named by `name`. Up to `fileConcurrency` requests are in flight at once. Each response must be JSON. The `response` / `update:model-value` payload is the single response for one file, or an array of responses in file order for several. If any request fails the remaining uploads are aborted and `error` is emitted.

In both behaviors the `headers`, `qparams` and authorization rules below apply to every request.

### Sample responses (unchunked)

The component does not require a specific JSON shape. Whatever the server returns is passed through to `response` / `update:model-value`. The samples below are illustrative.

**Single request (`fileConcurrency <= 0`)** - one response describing all files, emitted as-is:

```json
{
  "files": [
    { "fileName": "a.txt", "size": 1024, "contentType": "text/plain", "id": "5f2c..." },
    { "fileName": "b.txt", "size": 2048, "contentType": "text/plain", "id": "9a71..." }
  ]
}
```

**One request per file (`fileConcurrency >= 1`)** - each request returns a response for its own file:

```json
{ "fileName": "a.txt", "size": 1024, "contentType": "text/plain", "id": "5f2c..." }
```

With one selected file the emitted value is that object. With several files the emitted value is an array of the responses in file order:

```json
[
  { "fileName": "a.txt", "size": 1024, "contentType": "text/plain", "id": "5f2c..." },
  { "fileName": "b.txt", "size": 2048, "contentType": "text/plain", "id": "9a71..." }
]
```

**Error responses** (any non-2xx status) can be JSON or text. The body is included in the emitted `error` message, e.g. `{ "error": "File type not allowed." }`.

### Error handling (single request, `fileConcurrency <= 0`)

The whole selection is one request, so it succeeds or fails as a unit. There are no retries.

| Condition | Result |
|-----------|--------|
| Non-2xx status | `error` is emitted as `Upload failed with status {status}.` followed by a new line and the response body. A JSON body (`Content-Type` containing `/json`) is included as compact JSON text, anything else as plain text. |
| 2xx status but the body is not valid JSON (for example `204 No Content` or an empty body) | `error` is emitted with the JSON parse error message, even though the server accepted the request. Always return a JSON body, such as `{}`, on success. |
| Network failure, CORS rejection or a thrown exception | `error` is emitted with the browser's message, for example `Failed to fetch`. |
| No file selected | `error` is emitted as `No file selected.` and no request is sent. |

On any error:

- `response` and `update:model-value` are not emitted.
- The slot `error` property is set and the `error` event is emitted once. The slot `error` is cleared when new files are selected or when the component is reset.
- `begin-request` and `end-request` are still emitted, and `isActive` returns to `false`.
- `file-uploaded`, `file-error` and `continueOnError` do not apply. They are only used by per-file and chunked uploads.
- The client cannot tell which files the server stored before it failed. A server that processes the files one at a time may have saved some of them, so it should roll back or report partial results in a success response.

Single-request mode has no progress reporting and cannot be cancelled. `progress` stays `0`, and calling the slot `cancel` or `reset` does not abort the request in flight. To get progress, cancellation and per-file error reporting, use `fileConcurrency >= 1`.

Sample error responses and the resulting `error` message:

```json
{ "error": "File type not allowed." }
```

```text
Upload failed with status 400.
{"error":"File type not allowed."}
```

### Error handling (one request per file, `fileConcurrency >= 1`)

Each file is its own request, so files succeed or fail independently. There are no retries. Per-file results are always reported through `file-uploaded` and `file-error`. What happens to the other files depends on `continueOnError`.

| Scenario | `file-error` | `error` event / slot `error` | Other files | `response` / `update:model-value` |
|----------|--------------|------------------------------|-------------|-----------------------------------|
| Non-2xx status for a file | Emitted with `error` = `Upload of {fileName} failed with status {status}.` followed by a new line and the response body (JSON bodies as compact JSON text, anything else as plain text). | `continueOnError=false`: emitted once, for the first failure. `continueOnError=true`: not emitted. | `false`: requests in flight are aborted and files not yet started are skipped. `true`: upload continues. | `false`: not emitted. `true`: emitted at the end with the successful responses only. |
| 2xx status but the body is not valid JSON (for example `204 No Content` or an empty body) | Emitted with the JSON parse error message. The file is treated as failed even though the server accepted it. | Same as above. | Same as above. | Same as above. The file is excluded. |
| Network failure, CORS rejection or a thrown exception | Emitted with the browser's message, for example `Failed to fetch`. | Same as above. | Same as above. | Same as above. |
| Several files fail (`continueOnError=true`) | One event per failed file, in the order the failures occur. | Not emitted. | All files are attempted. | Emitted with the successful responses only, in file order. |
| Every file fails (`continueOnError=true`) | One event per file. | Not emitted. | All files are attempted. | Not emitted. |
| Some files succeed before a failure (`continueOnError=false`) | One event for the failed file. | Emitted once. | Files that already finished keep their `file-uploaded` events. | Not emitted, so use `file-uploaded` to get the results of files that completed. |
| Not emitted. The `cancel` event is emitted when the slot `cancel` is used. |
| No file selected | Not emitted. | `error` is emitted as `No file selected.` and no request is sent. | — | Not emitted. |

Notes:

- `file-error` payload: `{ file, fileName, index, error }`, where `index` is the file's position in the selection. When `continueOnError` is `false`, `file-error` is emitted before `error`.
- In every case except "No file selected", `begin-request` and `end-request` are emitted and `isActive` returns to `false`. When no file is selected no request starts, so neither event is emitted.
- `progress` counts only successfully uploaded files, so it does not reach `100` if a file fails.
- The slot `error` property is only set when `continueOnError` is `false`. With `continueOnError` set to `true`, track failures with `file-error`.
- Aborted requests are not reported as failures. The client cannot tell whether the server stored a file whose request was aborted, so it should discard or expire incomplete uploads.
- The final value with `continueOnError=true` has no placeholders for failed files, so use the `index` from `file-error` to match results to the selection. With one file selected the value is that file's response, otherwise an array.

Sample `file-error` payload:

```json
{
  "fileName": "b.txt",
  "index": 1,
  "error": "Upload of b.txt failed with status 500.\r\n{\"error\":\"Disk full.\"}"
}
```

## Chunked request contract

Each chunk is a separate `POST` (multipart/form-data) to `url` (with `qparams`).

**Form fields**

| Field      | Description |
|------------|-------------|
| data       | The `body` value (when set). To send additional fields with the uploaded file add them to the `body` object.|
| {name}     | The chunk's binary content (field named by `name`). This is the IFormFile parameter received by the backend.|

**Headers** (in addition to `headers`, `X-Requested-With` and `Authorization`)

| Header           | Description |
|------------------|-------------|
| X-Upload-Id      | GUID identifying the file upload; the same for all chunks of a file. |
| X-File-Size      | Total file size in bytes. |
| X-Chunk-Index    | Zero-based index of the chunk. |
| X-Chunk-Size     | Configured chunk size in bytes. |
| X-Total-Chunks   | Total number of chunks for the file. |

**Server requirements**

- Respond to every chunk with a 2xx status and a JSON body. Non-2xx responses are retried up to `chunkRetries`.
- Optionally include a `hash` property (hex SHA-256 of the received chunk) in the response. When present, the client verifies it against the chunk sent and retries on mismatch.
- Store chunks by `X-Upload-Id` and assemble the file when `X-Total-Chunks` chunks have been received. The response to the final chunk should contain the final result.
- Chunk handling should be idempotent because retries resend the same chunk.
- Resuming interrupted uploads is not supported.

Chunks are sent in order, one at a time per file, with retries completing before the next chunk is sent.

### Sample responses (chunked)

Every chunk response must be a 2xx JSON body. The component only inspects the optional `hash` property.

**Intermediate chunk** (not the last chunk) - acknowledges receipt. `hash` is optional:

```json
{
  "uploadId": "3f6c1d0e-8f0a-4c5e-9b7a-2d1e4a6b8c90",
  "chunkIndex": 0,
  "received": true,
  "hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
}
```

`hash` is the hex SHA-256 of the received chunk. If present, the component computes the SHA-256 of the chunk it sent and compares them (case-insensitive). A mismatch counts as a failed attempt and is retried. If `hash` is omitted, no verification is done. This is also emitted in the `chunk-uploaded` event as `response`.

**Final chunk** (`X-Chunk-Index` = `X-Total-Chunks` - 1) - the server has assembled the file and returns the final result. This is the value emitted as `response` / `update:model-value` for that file:

```json
{
  "uploadId": "3f6c1d0e-8f0a-4c5e-9b7a-2d1e4a6b8c90",
  "chunkIndex": 2,
  "received": true,
  "complete": true,
  "fileName": "video.mp4",
  "size": 10485760,
  "id": "5f2c..."
}
```

With one selected file the emitted value is the final chunk response above. With several files the emitted value is an array of each file's final chunk response, in file order:

```json
[
  { "uploadId": "3f6c...", "complete": true, "fileName": "video.mp4", "size": 10485760, "id": "5f2c..." },
  { "uploadId": "a81d...", "complete": true, "fileName": "notes.pdf", "size": 52311, "id": "9a71..." }
]
```

**Failed chunk** - any non-2xx status. The chunk is retried up to `chunkRetries` times, then the upload stops and `error` is emitted with the status and response body:

```json
{ "error": "Chunk 2 of 3 could not be stored." }
```

## Multi-file error handling

Applies to per-file unchunked uploads (FileConcurrency >= 1) and chunked uploads with more than one file. Each file completion or failure is reported through File-uploaded and File-error.

| | continueOnError = false (default) | continueOnError = 	rue |
|---|---|---|
| A file fails | All other uploads are aborted and files not yet started are skipped. file-error then error are emitted. | Other files keep uploading. Only file-error is emitted for the failure. |
| error event | Emitted once, for the failed file. | Not emitted for file failures. |
| 
response / update:model-value | Not emitted. Use file-uploaded to get the results of files that completed before the failure. | Emitted once at the end with **only the successful responses** (a single object if one file was selected, otherwise an array in file order, skipping failed files). Not emitted if every file failed. |

Cancelling or resetting aborts the upload silently (no file-error or error). In single-request mode (fileConcurrency <= 0) these options do not apply: it is one request.

Example:

```vue
<cui-file-uploader
  url="/api/upload"
  :continue-on-error="true"
  :file-concurrency="3"
  v-model="succeeded"
  v-on:file-uploaded="e => uploaded.push(e.fileName)"
  v-on:file-error="e => failures.push({ name: e.fileName, message: e.error })" />
```

Sample `file-error` payload:

```json
{ "fileName": "b.txt", "index": 1, "error": "Upload of b.txt failed with status 500.\r\n{...}" }
```

## Authorization

The component checks sessionStorage for the key `api-auth-token|{origin}` (origin of `url`). If `headers` has no `Authorization` header and a token is found, it is added to the request. The stored value should include the token type, e.g. `Bearer abc123`. The `headers` prop is not modified.
