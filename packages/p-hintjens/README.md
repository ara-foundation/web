# P-Hintjens
This package is named in [Pieter Hintjens](https://en.wikipedia.org/wiki/Pieter_Hintjens) honor.

Another name of the package that describes its purpose is **Typescript enhancement**. Which simply adds additional functions that simplifies your work flow.

Useful scripts you can take from this package:

- 🤖 **Traits** adds additional methods that works with the Typescript data types. List of traits and example utility they could provide:
    * Array &ndash; `isEqualArray` makes sure two arrays have the same element data.
    * Enum &ndash; `enumValues` and `enumKeys` returns list of values or keys from the defined enum.
    * Object &ndash; `deepCopy` creates a new copy of the object by value.
    * String &ndash; `capitalizeFirstLetter` simply makes the first letter of the string uppercase.
- 📝 **Ara Link** adds various types of links between objects.
    * Ara Link &ndash; A generic Link that could link to any resource, not only text value.
    * Module Link &ndash; either a file url or a Purl. Used to create module IDs.
- 🛠️ **Debug** Much better version of `console.log` that puts intends as the code flow enters into a new function.
- 🔌 **Interfaces** various interfaces to cast object into this interface.
    * get-text &ndash; cast object into an interface with `getText() => string` method.
- 🔒 **Result** return `Result<ReturnType>` from function, and if the result is error, don't throw exceptions.

## The decorators
The `staticImplements` allows creating interfaces with the static methods.

URL: `@ara-web/p-hintjens?id=ObjectTraits.staticImplements#traits/traits/object-traits`.

# Roadmap
* Create another decorator called @todo() allowing to print a todo in the logs using `Debug`.