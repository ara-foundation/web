export function fooBar(name, surname) {
    return name.length + surname.length;
}
export const helloAndWelcome = () => {
    return "Hello and Welcome";
};
export var Sex;
(function (Sex) {
    Sex[Sex["Male"] = 0] = "Male";
    Sex[Sex["Female"] = 1] = "Female";
})(Sex || (Sex = {}));
