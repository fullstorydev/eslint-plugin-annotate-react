'use strict';

const { join } = require('path');

//------------------------------------------------------------------------------
// Test File Definitions
//------------------------------------------------------------------------------

const singleComponent = `const temp = () => {
  <Icon data-component="temp" name="metric" size={24} />;
};`;
const singleComponentError = `const temp = () => {
  <Icon name="metric" size={24} />;
};`;

const genericTest = `
const yAxis = (xScale, xTicks) => (
  <BottomAxis<Date> data-component="yAxis" width={1} height={1} xScale={xScale} xTicks={xTicks}>
    123
  </BottomAxis>
); `;
const genericTestError = `
const yAxis = (xScale, xTicks) => (
  <BottomAxis<Date> width={1} height={1} xScale={xScale} xTicks={xTicks}>
    123
  </BottomAxis>
); `;

const renamingComponentDoesntError = `
const myDiv = () => (
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
          `;
const multipleComponents = `
            const Component1 = () => <div data-component="Component1" />;
            const Component2 = () => <span data-component="Component2" />;
          `;

const fragmentsWontUpdate = `const Component = () => {
  <>
    <a/>
    <a/>
    <a/>
  </>
};`;

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
