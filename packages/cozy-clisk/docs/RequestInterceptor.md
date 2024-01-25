# RequestInterceptor

## Intercepting HTTP requests in clisk konnectors

To intercept HTTP requests, you can init the RequestInterceptor like this :

```javascript
import {
  ContentScript,
  RequestInterceptor
} from 'cozy-clisk/dist/contentscript'

const requestInterceptor = new RequestInterceptor([
  {
    identifier: 'testRequest',
    method: 'GET',
    url: 'test/api',
    serialization: 'json'
  }
])
requestInterceptor.init()

const connector = new ContentScript({ requestInterceptor })
```

This will intercept all requests with method 'GET' and containing 'test/api' in their url. The
response  of these requests will be serialized to a json object.

## Fetching the response

You can fetch the intercepted response in two ways : `waitForRequestInterception` or directly
listening to requestInterceptor events.


### waitForRequestInterception

Once you have defined an interception with a given `testRequest` identifier, you can wait for it to
happen using the following from the pilot:

```javascript
const testRequestResponse = await this.waitForRequestInterception('testRequest')
```

It is important that waitForRequestInterception is run before the real request response to be
received. Or else you won't get anything and the promise will reject with a Timeout error.

`testRequestResponse` will have the form :

```javascript
{
  identifier: 'testRequest',
  url: '...', // the real intercepted url
  method: 'GET',
  response : {}, // a javascript object in our case
  responseHeaders : {} // a javascript object with all response headers
  requestHeaders : {} // a javascript object with all request headers
}
```

### RequestInterceptor events

Each the the RequestInterceptor object intercepts an expected request, defined in it's
instanciation, it will emit an event that you can intercept in onWorkerEvent method from the pilot
 like this:

 ```javascript
 onWorkerEvent({ event, payload }) {
  if (event === 'requestResponse' && payload.label === 'testRequest') {
    // the payload contains the whole response like defined in the previous section
  }
}
 ```





