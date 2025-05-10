# Code Level
The Code Level's goal is to analyze the given
typescript/javascript source code and return
evaluated identifiers.

Supported identifiers:
* Imported identifiers
* Variable declaration
* Type declaration
* Constants
* Functions

Not yet supported identifiers
* Class
* Object

## Terminology

### 1. TypeScript Node (TsNode)
The Reflect turns the source code into an
Abstract Syntax Tree (AST) and filters out
the code that Reflect supports.

For generating AST from source code, reflect relies on [TsMorph](ts-morph.com) package.

The filtered out nodes aren't stored directly as it is provided by the TsMorph. Instead it's simplified and stored as a `TsNode`.

### 2. AST Node
Using the TsNodes, Reflect then creates the `AstNode`.

The primary advantage of `AstNode` compared to the Typescript's own AST or `TsNode` is that, any commands or instructions are also converted into a single ast node.

In TsMorph, the variable statement AST will be an array of nodes that has `let` keyword, variable name, variable's assignment etc.
But in Reflect, the Variable declaration's node will be a single node.

#### 2.1 AST Node Memory
The AST Node memory holds the sub ast data.
For example if the code piece has a generic type,
then additional ast nodes referred by generic type is declared in the ast node's internal memory.

#### 2.2 AST Node Data
The Ast Node data holds all possible type of code pieces and what is their type.
For example if the code piece is a type declaration, then it could be a single type, union type or intersected type.

#### 2.3 AST Node Context
The Ast Node context is a three layer memory that has all code peices available during an execution of the code piece. 

#### 3. Import Level
Import level converts the import declaration `TsNode` 
into Ast Node.

#### 4. Type Level
Type level converts the type declaration `TsNode` into Ast Node. As well is type refences in the values into Ast Node's `dataType` property.

#### 5. Value Level
The value level modules convert the `TsNode` into data
n Ast node's value. If the value is a function call, call the function and assigns the result into `AstNode` data property. If the TsNode is a literal value, then assign the value to the `AstNode` data property etc.

#### 6. Variable Level
The variable module converts the Variable statement into Ast Node.

##### 6.1 Variable name is an object binding
Typescript supports pattern matching, by which
property of an object could be used as a variable name:

```typescript
const obj = {property: "Hello"}
const {property} = obj;
```

The Ast Node of variable will have the object that its binding in the Ast Node's memory.

### Code
The Code is the primary interface of the code level.
The code instance is created by providing the source code as a string.

Internally the `Code` will turn the source code into an TsMorph's Ast Tree.

Code exposes the interface to work with all code pieces. Direct interaction with the code pieces is discouraged.

### Code phases
For each code pieces, the `Code` exposes at least two types of methods.

First is retreival of the Ast Node. This methods will call nested levels to generate code pieces from AST nodes.

But sometimes, the value of a code depends on the another code piece. In that regard, the Code will generate a link to the expression and assign it in the data.

Once you have a list of code pieces with the reference to a data, the second phase is linting which will evaluate and look for a data result.

#### How to use `Code` in Extension to generate module content?
Extensions that has to generate module content will first get all code pieces one by one.

Then lint the code pieces.

The linted code pieces is then assigned into the Ast Node Memory.