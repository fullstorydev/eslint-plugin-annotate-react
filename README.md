# @fullstory/eslint-plugin-annotate-react

An ESLint plugin for annotating React components.

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

## Running tests in development

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
