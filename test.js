'use strict';

const { join } = require('path');

//------------------------------------------------------------------------------
// Test File Definitions
//------------------------------------------------------------------------------

const singleComponent = `export const temp = () => {
  return <Icon data-component="temp" name="metric" size={24} />;
};`;

const singleComponentError = `export const temp = () => {
  return <Icon name="metric" size={24} />;
};`;

const defaultSingleComponent = `export default function temp () {
  return <Icon data-component="temp" name="metric" size={24} />;
};`;

const defaultSingleComponentError = `export default function temp () {
  return <Icon name="metric" size={24} />;
};`;

const genericTest = `
export const yAxis = (xScale, xTicks) => (
  <BottomAxis<Date> data-component="yAxis" width={1} height={1} xScale={xScale} xTicks={xTicks}>
    123
  </BottomAxis>
); `;
const genericTestError = `
export const yAxis = (xScale, xTicks) => (
  <BottomAxis<Date> width={1} height={1} xScale={xScale} xTicks={xTicks}>
    123
  </BottomAxis>
); `;

const renamingComponentDoesntError = `
export const myDiv = () => (
  <div data-component="temp"/>
); `;

const nestedComponentsError = /* tsx */ `
export const FooChart: React.FC<FooChartProps> = props => {
  const [spacing, setSpacing] = useState({ top: 8, right: 38, bottom: 50, left: 50 });

  return (
    <Chart height={400} spacing={spacing}>
      {({ height, width, overlay }) => (
        <InnerFooChart
          width={width}
          height={height}
          overlay={overlay}
          spacing={spacing}
          setSpacing={setSpacing}
          {...props}
        />
      )}
    </Chart>
  );
};`;

const nestedComponents = /* tsx */ `
export const FooChart: React.FC<FooChartProps> = props => {
  const [spacing, setSpacing] = useState({ top: 8, right: 38, bottom: 50, left: 50 });

  return (
    <Chart data-component="FooChart" height={400} spacing={spacing}>
      {({ height, width, overlay }) => (
        <InnerFooChart
          width={width}
          height={height}
          overlay={overlay}
          spacing={spacing}
          setSpacing={setSpacing}
          {...props}
        />
      )}
    </Chart>
  );
};`;

const multipleComponentsErrors = `
            const Component1 = () => <div />;
            const Component2 = () => <span />;
            export { Component1, Component2 }
          `;
const multipleComponents = `
            const Component1 = () => <div data-component="Component1" />;
            const Component2 = () => <span data-component="Component2" />;
            export { Component1, Component2 }
          `;

const fragmentsWontUpdate = `export const Component = () => 
  <>
    <a/>
    <a/>
    <a/>
  </>
;`;

const classComponent = `export class Car extends React.Component {
  render() {
    return <h2 data-component="Car">Hi, I am a Car!</h2>;
  }
}`;

const classComponentError = `export class Car extends React.Component {
  render() {
    return <h2>Hi, I am a Car!</h2>;
  }
}`;

const classComponentNestedError = `export class Car extends React.Component {
  render() {
    const Door = () => (
      <h1>I am a door!</h1>
    );
    return (
      <div>
        <Door />
        <h2>Hi, I am a Car!</h2>
      </div>
    );
  }
}`;

const classComponentNested = `export class Car extends React.Component {
  render() {
    const Door = () => (
      <h1>I am a door!</h1>
    );
    return (
      <div data-component="Car">
        <Door />
        <h2>Hi, I am a Car!</h2>
      </div>
    );
  }
}`;

const reactForwardRef = /* tsx */ `
export const InternalLink = React.forwardRef<HTMLAnchorElement, InternalLinkProps>(
  ({ variant, ...props }, ref) => (
    <Link data-component="InternalLink"
      ref={ref}
      className={classNames(css.link, { [css.inverse]: variant === 'inverse' })}
      {...props}
    >
      {props.children}
    </Link>
  ),
);`;

const reactForwardRefError = /* tsx */ `
export const InternalLink = React.forwardRef<HTMLAnchorElement, InternalLinkProps>(
  ({ variant, ...props }, ref) => (
    <Link
      ref={ref}
      className={classNames(css.link, { [css.inverse]: variant === 'inverse' })}
      {...props}
    >
      {props.children}
    </Link>
  ),
);`;

const forwardRef = /* tsx */ `
export const InternalLink = forwardRef<HTMLAnchorElement, InternalLinkProps>(
  ({ variant, ...props }, ref) => (
    <Link data-component="InternalLink"
      ref={ref}
      className={classNames(css.link, { [css.inverse]: variant === 'inverse' })}
      {...props}
    >
      {props.children}
    </Link>
  ),
);`;

const forwardRefError = /* tsx */ `
export const InternalLink = forwardRef<HTMLAnchorElement, InternalLinkProps>(
  ({ variant, ...props }, ref) => (
    <Link
      ref={ref}
      className={classNames(css.link, { [css.inverse]: variant === 'inverse' })}
      {...props}
    >
      {props.children}
    </Link>
  ),
);`;

const defaultReactForwardRef = /* tsx */ `
export default React.forwardRef<HTMLAnchorElement, InternalLinkProps>(
  function InternalLink({ variant, ...props }, ref) {
    return (
      <Link data-component="InternalLink"
        ref={ref}
        className={classNames(css.link, { [css.inverse]: variant === 'inverse' })}
        {...props}
      >
        {props.children}
      </Link>
    );
  }
);`;

const defaultReactForwardRefError = /* tsx */ `
export default React.forwardRef<HTMLAnchorElement, InternalLinkProps>(
  function InternalLink({ variant, ...props }, ref) {
    return (
      <Link
        ref={ref}
        className={classNames(css.link, { [css.inverse]: variant === 'inverse' })}
        {...props}
      >
        {props.children}
      </Link>
    );
  }
);`;

const defaultForwardRef = /* tsx */ `
export default forwardRef<HTMLAnchorElement, InternalLinkProps>(
  function InternalLink({ variant, ...props }, ref) {
    return (
      <Link data-component="InternalLink"
        ref={ref}
        className={classNames(css.link, { [css.inverse]: variant === 'inverse' })}
        {...props}
      >
        {props.children}
      </Link>
    );
  }
);`;

const defaultForwardRefError = /* tsx */ `
export default forwardRef<HTMLAnchorElement, InternalLinkProps>(
  function InternalLink({ variant, ...props }, ref) {
    return (
      <Link
        ref={ref}
        className={classNames(css.link, { [css.inverse]: variant === 'inverse' })}
        {...props}
      >
        {props.children}
      </Link>
    );
  }
);`;

const provider = /* tsx */ `
export const Test = () => <TestProvider />;
`;

const providerWithDot = /* tsx */ `
export const Test = () => <Test.Provider />;
`;

const ternary = /* tsx */ `
export const TernaryComponent = () => {
  const active = useIsActive();
  return active ? <ActiveComponent /> : null;
};
`;

const exportedError = /* tsx */ `
const NotExported = () => <Foo />
export const Exported = () => <Foo />
export default DefaultExported = () => <Foo />
const ExportedAtEnd = () => <Foo />
const RenamedExport = () => <Foo />
export { ExportedAtEnd, RenamedExport as ThisIsRenamed }
`;

const exported = /* tsx */ `
const NotExported = () => <Foo />
export const Exported = () => <Foo data-component="Exported" />
export default DefaultExported = () => <Foo data-component="DefaultExported" />
const ExportedAtEnd = () => <Foo data-component="ExportedAtEnd" />
const RenamedExport = () => <Foo data-component="RenamedExport" />
export { ExportedAtEnd, RenamedExport as ThisIsRenamed }
`;

// TODO: Implement fix for if block conditionals
// const ifBlock = /* tsx */ `
// export const IfBlockComponent = () => {
//   const active = useIsActive();
//   if (active) {
//     return <ActiveComponent />;
//   }
//   return <div />;
// };
// `;

const tests = {
  'data-component': {
    // Require the actual rule definition
    rule: require('./index').rules['data-component'],

    // Define eslintrc for the test
    ruleConfig: {
      env: {
        es6: true,
      },
      parser: join(__dirname, 'node_modules/@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'data-component': 'error',
      },
    },

    // Define the test cases
    testCases: {
      valid: [
        {
          code: singleComponent,
        },
        {
          code: defaultSingleComponent,
        },
        {
          code: genericTest,
        },
        {
          code: renamingComponentDoesntError,
        },
        {
          code: nestedComponents,
        },
        {
          code: multipleComponents,
        },
        {
          // Multiple return paths should not trigger the eslint warning
          code: fragmentsWontUpdate,
        },
        {
          code: reactForwardRef,
        },
        {
          code: forwardRef,
        },
        {
          code: defaultReactForwardRef,
        },
        {
          code: defaultForwardRef,
        },
        {
          code: provider,
        },
        {
          code: providerWithDot,
        },
        {
          code: ternary,
        },
        {
          code: exported,
        },
      ],
      invalid: [
        {
          code: singleComponentError,
          output: singleComponent,
          errors: [
            'temp is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: defaultSingleComponentError,
          output: defaultSingleComponent,
          errors: [
            'temp is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: classComponentError,
          output: classComponent,
          errors: [
            'Car is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: classComponentNestedError,
          output: classComponentNested,
          errors: [
            'Car is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: genericTestError,
          output: genericTest,
          errors: [
            'yAxis is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: nestedComponentsError,
          output: nestedComponents,
          errors: [
            'FooChart is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          // Multiple components with errors
          code: multipleComponentsErrors,
          output: multipleComponents,
          errors: [
            'Component1 is missing the data-component attribute for the top-level element.',
            'Component2 is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: reactForwardRefError,
          output: reactForwardRef,
          errors: [
            'InternalLink is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: forwardRefError,
          output: forwardRef,
          errors: [
            'InternalLink is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: defaultReactForwardRefError,
          output: defaultReactForwardRef,
          errors: [
            'InternalLink is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: defaultForwardRefError,
          output: defaultForwardRef,
          errors: [
            'InternalLink is missing the data-component attribute for the top-level element.',
          ],
        },
        {
          code: exportedError,
          output: exported,
          errors: [
            'Exported is missing the data-component attribute for the top-level element.',
            'DefaultExported is missing the data-component attribute for the top-level element.',
            'ExportedAtEnd is missing the data-component attribute for the top-level element.',
            'RenamedExport is missing the data-component attribute for the top-level element.',
          ],
        },
      ],
    },
  },
};

//------------------------------------------------------------------------------
// Test Runner Definition
//------------------------------------------------------------------------------

const { RuleTester } = require('eslint');

RuleTester.it = function (text, method) {
  test(text, method);
};

RuleTester.describe = function (text, method) {
  describe(text, method);
};

Object.keys(tests).forEach((key) => {
  const test = tests[key];

  const ruleTester = new RuleTester(test.ruleConfig);

  ruleTester.run(key, test.rule, test.testCases);
});
