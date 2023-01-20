# @fullstory/eslint-plugin-annotate-react

An ESLint plugin for adding 'data-attribute' to React components. The purpose of this plugin is to automatically
make css selectors. Here is an example

```
const myDiv = () => (
  <div/>
); `;
```

This plugin will autofix and add data-component to the div

```
const myDiv = () => (
  <div data-component="temp"/>
); `;
```

This plugin is intended to not be too opinionated. In general the approach is to suggest to the developer to add 'data-attribute' when there is an obvious approach, but in questionable cases, the plugin will tend towards being quiet.

- When there is a [fragment](https://reactjs.org/docs/fragments.html) this plugin won't add data-attribute
- Where there are multiple return elements this plugin won't add data-attribute

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `@fullstory/eslint-plugin-annotate-react`:

```sh
npm install @fullstory/eslint-plugin-annotate-react --save-dev
```

## Usage

Add `@fullstory/eslint-plugin-annotate-react` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
  "plugins": ["@fullstory/annotate-react"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "@fullstory/annotate-react/data-component": "error"
  }
}
```

## Maintaining this plugin

Tests can be ran using

```
npm run test
```

## Supported Rules

### @fullstory/annotate-react/data-component

...

## Release

Run this command to bump the version, push the tag, and create the release on GitHub:

```sh
npx np <patch | minor | major> --no-publish --no-tests
```
