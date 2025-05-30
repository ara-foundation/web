# Restful SDS

Restful SDS is a module that wraps your app's state by a Restful API.
Suppose, in your app you have the following method to update the user's nickname:

`UserClass.updateUsername(userId: 'john@email.com', newUsername: 'johnDoe')`.

With the Restful API, the above line could be replaced by the following line of code:

`rest.patch!('user#john@email.com[userName]', 'johnDoe')`.

Or suppose the new user registration is done using the following code:

`UserClass.signUp(userId: 'john@email.com', pwdHash: 'some_hash', userName: 'johnDoe')`

With the Restful API, the above line could be replaced by the following line of code:

`rest.post!('user', {userId: 'john@email.com', pwdHash: 'some_hash', userName: 'johnDoe'})`

Similarly, we can use the `rest.get` method to fetch user's information from the app state.

Restful api, turns the HTTP based rest methods such as `GET`, `POST`, `PUT`, `PATCH` and `DELETE` into a Rest module's methods. As the navigation to the objects, it uses the [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors).

## Why would you need it?
In SDS, if a file has to call another file, then they should have parent-child, or sibling relationship. This ensures a locality which in turn makes your app easy to understand. 

But often we have to use third party packages. Or some other data that is stored somewhere else. For such situations, we recommend using the Restful API.

Let's say we launched our app with the above `UserClass` but interaction goes using the Rest. It became the next TikTok, a next hit that people want to use, people rush to sign up on our app. We see our server can't keep up. It's exactly the UserClass is having a heavy duty. Knowing it, we move away  `UserClass` out of the app into a microservice. 
Since we are using the Restful API, our code doesn't have to worry where is the user class is located in, is it in the same computer, or on another computer.

Few years later, our app became super popular, there is FOMO, everybody talks about us, that we forecast another 20 million signs ups in the following year. We containerize our microservice, and deploy a cluster of UserClasses on google cloud. Still, for our App it's the restful API, and we don't have to change the code even if it gets floated by heavy lifting.

Restful API allows to write the interrelated data, and keep all their relationships as the Rest methods. Simply create an app as a separate data in the same app. As the necessary time comes, turn it into a microservice. Then turn it into a cluster. As the app gets peak, we can revert back the clusters into a microservice without changing code itself. Doesn't matter you have the 2 sign ups per day, or 20 million.

Isn't it good?


## Guide to turn Chess game backend into a Restful api
Firstly, we need to create a module that can build ontological object tree for our app state.
I personally prefer to use `<data>-object-tree.ts` file names.

Let's say my app is a chess game backend that has three types of data: `User`, `Session`.

Then, I create the basic game information as `ChessData` which is any of those three types. Let's create a file `chess-object-tree.ts` and define our Restful object:

```ts
type ChessData = User | Session
```

In order to create the 'ChessData' ontological tree, we need to implement two methods from `@ara-web/sds`:

* `DataToObjectNode<ChessData>` which receives the `User` or `Session` and returns the ObjectNode.
* `DataOperations<ChessData>` which creates helper functions for each module such as `getName`, `getChildren`, attribute getters and setters.

Check out the `@ara-web/sds` source code's test files to see how to implement your own object trees.

Our state is ready. Let's implement the rest in our server's router:

```ts
//router.ts
import { Rest } from "@ara-web/sds";
import { chessDataToObjectNode, type ChessData } from "./chess-object-tree.ts";

const rest = new Rest<ChessData>(chessDataToObjectNode);

rest.post!('user', userData);
rest.get!('session');
```

Note that, we use the tags such as `user` and `session`, how do we know which of the tags is assigned to the `ChessData`? We define it in our `DataOperations<ChessData>.getName`:

```ts
import { DOCUMENT_SELECTOR } from "@ara-web/sds";

const chessOps: DataOperations<ChessData> = {
    getName(data?: ChessData): string {
        if (data instanceof User) {
            return 'user'; // custom element tag, equivalent of html's span, p, a, header, etc.
        } else if (data instanceof Session) {
            return 'session';
        } else {
            return DOCUMENT_SELECTOR;
        }
    }
}
```

## Updating the chess state by Rest
Our Ontological data is separated from the app state. Which means when we are thinking about development, we don't have to worry about the Restful object trees. 

But it also means, Restful SDS module has no clue how to update the app state, let's say how does Restful SDS know how to update the database record when we are manipulating the ontological data.

For this purpose we need to implement `RestfulHandler` for each ontological data. SDS package already comes with the `RestHandler` that implements the `RestfulHandler` interface. 
You only need to implement the necessary handler for each rest method, and match the filtering tag such as `user` or `session` and in the handler, simply call your database related function.

Suppose we created the restful handlers for each class:

```ts
import { RestHandler, ModuleLink, type Setup } from "@ara-web/sds";

const userPurl = ModuleLink.newPackageLink('@org', 'app-user-handler');
const userHandler = new RestHandler(userPurl, 'user');

const sessionPurl = ModuleLink.newPackageLink('@org', 'app-session-handler');
const sessionHandler = new RestHandler(sessionPurl, 'session');

const restSetup: Setup = {
    extensions: [userHandler, sessionHandler]
}
const rest = new Rest<ChessData>(chessDataToObjectNode, restSetup);
// rest.post!(); rest.get!()
```

Optionally, the rest constructor accepts the SDS Service Setup configuration where we list our proxies and extensions.
All handlers are defined as the extensions for the Restful API.

This is basic, and for now it should work. But let's jump into advanced topics.

## Extending Restful API by adding leaderboard
After launching our chess game, we encountered into a problem of user retention. We decided to integrate the weekly leaderboard and rewards to engage with the people.

We added new database models: `Reward` and `Leaderboard`.

How do we implement it without changing the current logic? After all, our leaderboard is the side plugin that doesn't affect the game logic. If we add changes into our current game state, for example, by adding the property 'score` into the `User`, then we have to add changes everywhere which just makes our game both a chess and leaderboard coupled together. Goodbye modularity. Instead, we will implement completely new data models as `Reward` which keep tracks what users might get for the top ten on the leaderboard rating, and the `Leaderboard` where we track the user scores.

Remember, we don't change the code that we have for the game.
So, instead updating the chess data, lets create the `leaderboard-object-tree.ts` with the following information:

```ts
export type LeaderboardData = ChessData | Leaderboard | Reward;
```

In the leaderboard data's operation and leaderboard data to ontological object node methods, we check the data types. If our data is instance of `Leaderboard` or `Reward`, then we implement the conversions in our `leaderboard-object-tree.ts`, otherwise we forward the function to the `chess-object-tree.ts` module.

The only thing we need to do is simply change the `router.ts` and use the Rest with the LeaderboardData instead ChessData:

```ts
//router.ts
const rest = new Rest<LeaderboardData>(leaderboardDataToObjectNode, restSetup);
// rest.post, rest.get
```

If we want to update the leaderboard data, we can add the necessary restful handlers as well.

## Adding tournaments
After a few days, our project manager calls us and says, leaderboards aren't enough, we need to add the tournaments.
He proposes a world cup starting from the region, to the world championship.

So, we add a new module `tournament.ts` with the following data models: `Tournament`, `CountryTournament`, `ContinentTournament` and `WorldTournament`.

The continent tournament depends on country tournament, if user won the country tour, he will be qualified for the continent tour. The top two country from each continent will be qualified for the world tournament.

Do we have to add for each of the tournament model a handler, and check the qualifications by reading previous tournament data?

Luckily, there is another way to add sub selectors.
We define our `Tournament` object with the `SubRestfulHandler` that will manage the geo-tournaments.

When we add a new tournament: `rest.post('tournament', Tournament);`, the restful sds will check does our data follows the `SubRestfulHandler`, and if so, it will automatically register the tournament handler automatically.

Which I highly recommend to do.
hope my guide wasn't boring, and if so, let me know with your suggestion to improve the guide to make it more easier to understand.
