const providerRegex = /Provider$/;

function getJSXElementName(jsx) {
  if (jsx.openingElement.name.type === 'JSXIdentifier') {
    // e.g. List
    return jsx.openingElement.name.name;
  }
  if (jsx.openingElement.name.type === 'JSXMemberExpression') {
    // e.g. List.Provider
    return `${jsx.openingElement.name.object.name}.${jsx.openingElement.name.property.name}`;
  }
}

function handleJSX(context, name, jsx) {
  if (
    !providerRegex.test(getJSXElementName(jsx)) &&
    !jsx.openingElement.attributes.find(
      (a) => a.name?.name === 'data-component',
    )
  ) {
    context.report({
      node: jsx.openingElement,
      message: `${name} is missing the data-component attribute for the top-level element.`,
      fix(fixer) {
        return fixer.insertTextAfterRange(
          jsx.openingElement.typeParameters
            ? jsx.openingElement.typeParameters.range
            : jsx.openingElement.name.range,
          ` data-component="${name}"`,
        );
      },
    });
  }
}

function handleBlockStatement(context, name, block) {
  // Find the root return statement. Are there any other types of returns we need to handle?
  const ret = block.body.find((c) => c.type === 'ReturnStatement');
  if (ret && ret.argument.type === 'JSXElement') {
    handleJSX(context, name, ret.argument);
  }
}

function isForwardRef(expression) {
  const calleeName =
    expression.callee.type === 'MemberExpression'
      ? expression.callee.property.name
      : expression.callee.name;
  return calleeName === 'forwardRef' && expression.arguments.length == 1;
}

function handleExpression(context, name, expression) {
  switch (expression.type) {
    case 'FunctionExpression':
      handleBlockStatement(context, name, expression.body);
      break;
    case 'ArrowFunctionExpression':
      switch (expression.body.type) {
        case 'JSXElement':
          handleJSX(context, name, expression.body);
          break;
        case 'BlockStatement':
          handleBlockStatement(context, name, expression.body);
          break;
      }
      break;
    case 'ClassExpression':
      expression.body.body.forEach((x) => {
        if (x.type === 'MethodDefinition' && x.key.name === 'render') {
          handleBlockStatement(context, name, x.value.body);
        }
      });
      break;
    case 'CallExpression':
      if (isForwardRef(expression)) {
        handleExpression(context, name, expression.arguments[0]);
      }
      break;
  }
}

const rules = {
  'data-component': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Missing data-component attribute for top-level element of component',
        category: 'Instrumentation',
        recommended: true,
      },
      fixable: 'code',
    },
    create(context) {
      return {
        Program(root) {
          root.body.forEach((node) => {
            // We will need to save any non-exported declarations and handle them only if they get exported at the end
            let exported = false;
            if (
              (node.type === 'ExportNamedDeclaration' ||
                node.type === 'ExportDefaultDeclaration') &&
              node.declaration
            ) {
              exported = true;
              node = node.declaration;
            }

            switch (node.type) {
              case 'VariableDeclaration':
                node.declarations.forEach((variable) => {
                  handleExpression(context, variable.id.name, variable.init);
                });
                break;
              case 'FunctionDeclaration':
                handleBlockStatement(context, node.id.name, node.body);
                break;
              case 'ClassDeclaration':
                node.body.body.forEach((x) => {
                  if (
                    x.type === 'MethodDefinition' &&
                    x.key.name === 'render'
                  ) {
                    handleBlockStatement(context, node.id.name, x.value.body);
                    return;
                  }
                });
                break;
              case 'CallExpression':
                if (
                  isForwardRef(node) &&
                  node.arguments[0].type === 'FunctionExpression' &&
                  node.arguments[0].id
                ) {
                  handleExpression(
                    context,
                    node.arguments[0].id.name,
                    node.arguments[0],
                  );
                }
                break;
            }
          });
        },
      };
    },
  },
};

module.exports = { rules };
