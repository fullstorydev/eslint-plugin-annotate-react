# Covered Cases

This plugin is intended to not be too opinionated. In general the approach is to suggest to the developer to add 'data-component' when there is an obvious approach, but in questionable cases, the plugin will them and stay quiet.

### Covered

#### Basic function components

```tsx
const MyComponent = () => <div />;
```

> MyComponent is missing the data-component attribute for the top-level element.

```tsx
function MyComponent() {
  return <div />;
}
```

> MyComponent is missing the data-component attribute for the top-level element.

```tsx
export default function MyComponent() {
  return <div />;
}
```

> MyComponent is missing the data-component attribute for the top-level element.

#### Typescript generic components

```tsx
const yAxis = (xScale, xTicks) => (
  <BottomAxis<Date> width={1} height={1} xScale={xScale} xTicks={xTicks}>
    123
  </BottomAxis>
);
```

> yAxis is missing the data-component attribute for the top-level element.

#### Multiple components in a file

```tsx
const Component1 = () => <div />;
const Component2 = () => <span />;
```

> Component1 is missing the data-component attribute for the top-level element.
> Component2 is missing the data-component attribute for the top-level element.

#### Class-based components

```tsx
class Car extends React.Component {
  render() {
    return <h2>Hi, I am a Car!</h2>;
  }
}
```

> Car is missing the data-component attribute for the top-level element.

#### Components wrapped with forwardRef

```tsx
export const Navigate = React.forwardRef<HTMLAnchorElement, NavigateProps>(
  (props, ref) => <Link ref={ref} {...props} />,
);
```

> Navigate is missing the data-component attribute for the top-level element.

### Ignored

#### Components with Provider as the top-level element

```tsx
export const App = () => <AppContext.Provider value={ctx} />;
```

> All good!

_Note: This just uses a simple `/Provider$/` regex test_

#### Components with a [React Fragment](https://reactjs.org/docs/fragments.html) as the top-level element

```tsx
const FragmentComponent = () => (
  <>
    <span />
    <div />
    <a />
  </>
);
```

> All good!

#### Components that conditionally return different values

```tsx
const ConditionalComponent = () => {
  const isActive = useIsActive();
  return isActive ? <div /> : null;
};
```

> All good!

```tsx
const ConditionalComponent = () => {
  const isActive = useIsActive();
  if (isActive) {
    return <ActiveComponent />;
  }
  return <div />;
};
```

> All good!
