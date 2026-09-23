# <cui-httprequest>

A component for making HTTP requests and binding the response to a variable.

## Usage

```vue
<cui-http-request
  url="https://jsonplaceholder.typicode.com/users"
  verb="GET"
  credentials="include"
  v-model="response"
  :qparams="{ id: 1 }"
  :headers="{ Accept: 'application/json' }"
  :trigger-on="trigger"
  v-on:error="handleError"
/>
```

## Props

| Name         | Type                | Default   | Description                                      |
|--------------|---------------------|-----------|--------------------------------------------------|
| modelValue   | Any                 | —         | Value for v-model binding (response data).        |
| url          | String (required)   | —         | The endpoint URL for the HTTP request.            |
| qparams      | Object              | `{}`      | Query/body parameters.                            |
| verb         | String              | `'GET'`   | HTTP method (`GET`, `POST`, etc.).                |
| credentials  | String              | `'same-origin'`| Credential handling (`same-origin`, `include`, `omit`). <br>Subject to CORS configuration and Cookie policies.               |
| headers      | Object              | `{}`      | HTTP headers.                                     |
| body         | String/Object       | `null`    | Request body (for POST/PUT).                      |
| disabled     | Boolean             | `false`   | Disables the request.                             |
| triggerOnAny	| Any                | —         | Any Change (truthy or not) to the trigger value will trigger a new request.|
| triggerOn		| Any				 | —	     | Triggers request when value is changed to a new truthy value. <br>Changing the trigger value from one truthy value i.e. 1 to another truthy value i.e. 2 will trigger the request. assigning the same value again will not. assigning a falsy value will not trigger the request.|

## Events

| Event Name           | Payload         | Description                                 |
|----------------------|-----------------|---------------------------------------------|
| update:model-value   | value           | Emitted when the response is received.      |
| update:is-active     | Boolean         | Emitted when request activity changes.      |
| received             | value           | Emitted when the response is received. <br>Response body passed as first parameter.      |
| error                | error           | Emitted when the request fails.  <br>Error object passed as first parameter.            |
| begin-request        | —               | Emitted when a request starts.              |
| end-request          | —               | Emitted when a request ends.                |

## Authorization
The component checks for an authorization header stored in browser sessionStorage under the key `api-auth-token|{origin}` where `{origin}` is the origin of the url.
If the passed header object omits an Authorization header or passes null and token is found, it is included in the request headers.
The Authorization header stored in sessionStorage should be prefixed by the token type i.e. `Bearer` followed by a space and the token value like `Bearer abc123`.
## Features

- Supports GET, POST, PUT, DELETE, PATCH verbs.
- Binds response data to a variable via `v-model`.
- Emits events for request lifecycle and errors.
- Can be triggered programmatically via `trigger-on`.
