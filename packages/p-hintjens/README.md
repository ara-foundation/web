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

* Create Web Element URL based on CSS:
    - element:div#container/img#background
    - element:div#container/main/section#hero/a/img
    - element:img#src={0}?moduleURL=pkg:|file://
    - element:div#container/main/seciont#hero/section#links/a.button:nth-child(0)?moduleURL=''

If element has the dynamic data, then pass in the body
a qualifier.

if you have a dynamic data in the link, for example:
html://div#container/img#background?src=[0]&alty=""&fetchpriority="high"
then, it also means, the page will run the Module().executeExpression() in the component's class.

Some elements might have expressions. That generates the elements. The most common way is
the loop. the [] marks the component.module.expression://
html:ul/[0]