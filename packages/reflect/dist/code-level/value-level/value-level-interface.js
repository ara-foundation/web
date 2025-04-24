/* class decorator */
export function staticImplements() {
    return (constructor) => { constructor; };
}
