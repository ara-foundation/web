# Rest API
In order to start using Rest with your app, you need to prepare your app
by defining the links, as well as defining the ontological objects.
In SDS, ontological objects are like JSON, or data models in your database.
But instead of the IDs, it uses the Object Links. And the object is a part
of a tree, that knows who are its children and who are its parents and who are
its siblings.

For example:

```typescript
class Profile extends MongoDbModel {
    id: MongoId("1231231");
}
```

Converted into the

```typescript
class Profile {
    link: ObjectNode;
}
```

## Tutorial:
Our task is to convert the CodePiece into the Object Node.
For that, first 