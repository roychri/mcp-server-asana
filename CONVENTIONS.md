Use Typescript.
Use the new and improved Asana NodeJS SDK v3. DO NOT USE Asana Node.js SDK v1

When adding a new tool, make sure to also add it to the list_of_tools


## Advantages of using the v3 Node.js SDK

- **Using native, modern JavaScript features** - Our previous Node SDKs leveraged polyfills for functionality that is now natively supported (like Promises). The latest SDK versions take advantage of these native implementations and are more compatible with modern Node runtimes.
- **Standard interface** - Our latest Node SDK is built using tools which are common in the industry. It may be similar to SDKs you’ve used with other services.

## Differences between v1 and v3

### Instantiating the client

With the [v3 Node SDK](https://github.com/Asana/node-asana?tab=readme-ov-file#installation), you set your API access token once and then create an instance for each resource you wish to access (tasks, projects, etc).

Once you create the client instance, most of the method names should be the same. The full list is [here in the client’s GitHub repository](https://github.com/Asana/node-asana?tab=readme-ov-file#documentation-for-api-endpoints).

#### v3

```javascript
const Asana = require('asana');

let client = Asana.ApiClient.instance;
let token = client.authentications['token'];
token.accessToken = '<YOUR_ACCESS_TOKEN>';

let usersApiInstance = new Asana.UsersApi(); // instance to access users

usersApiInstance.getUser("me").then(function(me) {
  console.log(me);
});
```

#### v1

```javascript
const asana = require('asana');
const client = asana.Client.create().useAccessToken('<YOUR_ACCESS_TOKEN>');
client.users.me().then(function(me) {
  console.log(me);
});
```

### Pagination

The v3 Node SDK supports the `nextPage` method for pagination, but does not yet support the `fetch` or `stream` methods. To use `nextPage`, you must also explicitly set a limit where before there was a default of 50.

#### v3

```javascript
// Fetching the next page
tasksApiInstance.getTasks({ limit: 50 }).then(firstPage => { // set an explicit limit
  console.log(firstPage.data);
  firstPage.nextPage().then(secondPage => {
    console.log(secondPage.data);
  });
});

// Fetching up to 200 tasks with a page size of 50
tasksApiInstance
  .getTasks({ limit: 50, project: "1199684513975168" })
  .then(async (firstPage) => {
    let results = firstPage.data;

    // Get the next page
    let nextPage = await firstPage.nextPage();
    pageIndex = 2;

    // Keep fetching until there are no more results or
    // 200 results have been fetched
    while (nextPage.data && pageIndex <= 4) {
      results = results.concat(nextPage.data);
      console.log(pageIndex, results.length);
      // Get the next page
      nextPage = await nextPage.nextPage();
      pageIndex += 1;
    }
  });

```

#### v1

```javascript
// Fetching the next page
client.tasks.findAll({ limit: 50 }).then((firstPage) => {
  console.log(firstPage.data);
  firstPage.nextPage().then((secondPage) => {
    console.log(secondPage.data);
  });
});

// Fetching up to 200 tasks with a page size of 50
client.tasks
  .findAll({ limit: 50, project: "1199684513975168" })
  .then((collection) => {
    collection.fetch(200).then((tasks) => {
      console.log(tasks);
    });
  });
```

### OAuth grant flow

The V1 Node SDK managed the OAuth grant flow. The V3 SDK simply takes a Bearer token. You can use a standard library to manage the OAuth grant flow (recommended) or implement it yourself.

[This page](https://developers.asana.com/docs/getting-started-with-asana-oauth) has a list of common libraries for JavaScript and a code sample which you can use to get started.

### Adding headers to requests

#### V3

```javascript
const Asana = require('asana');

let client = Asana.ApiClient.instance;
let token = client.authentications['token'];
token.accessToken = '<YOUR_ACCESS_TOKEN>';

// Add asana-enable header for the client
client.defaultHeaders['asana-enable'] = 'new_goal_memberships';
```

#### V1

```javascript
const asana = require('asana');
const client = asana.Client.create().useAccessToken('<YOUR_ACCESS_TOKEN>');

asana.Client.create({"defaultHeaders": {"asana-enable": "new_goal_memberships"}});
```

