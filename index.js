const [DONE_WITH_TREE, DONE_WITH_SUBTREE] = [1, 2];

function traverseTree(node, visitorKeys, callback) {
  const stack = [[node, [], null]];

  while (stack.length > 0) {
    try {
      const current = stack.shift();
      const [currentNode, ancestors] = current;

      callback(...current);

      for (const visitorKey of visitorKeys[currentNode.type] ?? []) {
        const child = currentNode[visitorKey];

        if (Array.isArray(child)) {
          for (const childItem of child) {
            stack.push([childItem, [currentNode, ...ancestors], visitorKey]);
          }
        } else if (Boolean(child)) {
          stack.push([child, [currentNode, ...ancestors], visitorKey]);
        }
      }
    } catch (code) {
      if (code === DONE_WITH_TREE) {
        break;
      } else if (code === DONE_WITH_SUBTREE) {
        continue;
      }
    }
  }
}

function getReturnStatement(node) {
  if (!Boolean(node)) {
    return;
  }

  if (node.type === 'ClassDeclaration') {
    // For class-based components, find the render function, then its return statement
    renderFunction = node.body?.body?.find(
      (statement) =>
        statement.type === 'MethodDefinition' &&
        statement.key.name === 'render',
    );
    return renderFunction.value?.body?.body?.find(
      (statement) => statement.type === 'ReturnStatement',
    );
  }

  if (node.type === 'ArrowFunctionExpression') return node.body;
  return node.type === 'VariableDeclaration'
    ? node.declarations?.[0]?.init?.body?.body?.find(
        (statement) => statement.type === 'ReturnStatement',
      ) ??
        node.declarations?.[0]?.init?.arguments?.[0]?.body ??
        node.declarations?.[0]?.init?.body
    : node.body?.body?.find(
        (statement) => statement.type === 'ReturnStatement',
      );
}

function isForwardRef(node) {
  if (!Boolean(node)) {
    return;
  }

  return node.type === 'VariableDeclaration'
    ? node.declarations?.[0]?.init?.callee?.property?.name === 'forwardRef'
    : node.callee?.name === 'forwardRef' ||
        node.callee?.property?.name === 'forwardRef';
}

function isTreeDone(node, excludeComponentNames) {
  return (
    node.type === 'JSXElement' &&
    excludeComponentNames.every(
      (regex) =>
        !regex.test(
          node.openingElement.name.property
            ? node.openingElement.name.property.name
            : node.openingElement.name.name,
        ),
    ) &&
    !node.openingElement.attributes.find(
      (attributeNode) => attributeNode.name?.name === 'data-component',
    )
  );
}

function isSubtreeDone(node) {
  return (
    node.type === 'JSXFragment' ||
    (node.type === 'JSXElement' &&
      node.openingElement.attributes.find(
        (attributeNode) => attributeNode.name?.name === 'data-component',
      ))
  );
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
      const { visitorKeys } = context.getSourceCode();

      const excludeComponentNames =
        context.options?.[0]?.excludeComponentNames?.map(
          (regex) => new RegExp(regex),
        ) ?? [/Provider$/];

      return {
        Program(node) {
          const componentNodes = node.body
            .map((child) => {
              const declaration = child?.declaration ?? child;
              if (isForwardRef(declaration)) {
                // do something
                return declaration?.arguments?.[0] ?? declaration;
              }
              return declaration;
            })
            .filter(
              (child) =>
                child.type === 'VariableDeclaration' ||
                child.type === 'FunctionDeclaration' ||
                child.type === 'ClassDeclaration' ||
                child.type === 'FunctionExpression' ||
                child.type === 'ArrowFunctionExpression',
            )
            .filter((child) => {
              let flag = false;

              traverseTree(
                getReturnStatement(child),
                visitorKeys,
                (current) => {
                  if (current.type === 'JSXElement') {
                    flag = true;

                    throw DONE_WITH_TREE;
                  }
                },
              );

              return flag;
            })
            .filter((child) => {
              let flag = false;

              traverseTree(
                getReturnStatement(child),
                visitorKeys,
                (current) => {
                  if (isSubtreeDone(current)) {
                    throw DONE_WITH_SUBTREE;
                  } else if (isTreeDone(current, excludeComponentNames)) {
                    flag = true;

                    throw DONE_WITH_TREE;
                  }
                },
              );

              return flag;
            });

          componentNodes.forEach((componentNode) => {
            const componentName =
              componentNode?.id?.name ??
              componentNode?.declarations?.map(
                (declaration) => declaration?.id?.name,
              );

            let fixNode = null;

            traverseTree(
              getReturnStatement(componentNode),
              visitorKeys,
              (current) => {
                if (isSubtreeDone(current)) {
                  throw DONE_WITH_SUBTREE;
                } else if (isTreeDone(current, excludeComponentNames)) {
                  fixNode = current.openingElement;

                  throw DONE_WITH_TREE;
                }
              },
            );

            if (Boolean(componentName)) {
              context.report({
                node: fixNode,
                message: `${
                  Array.isArray(componentName)
                    ? componentName[0]
                    : componentName
                } is missing the data-component attribute for the top-level element.`,
                fix: (fixer) =>
                  fixer.insertTextAfterRange(
                    Boolean(fixNode.typeParameters)
                      ? fixNode.typeParameters.range
                      : fixNode.name.range,
                    ` data-component="${
                      Array.isArray(componentName)
                        ? componentName[0]
                        : componentName
                    }"`,
                  ),
              });
            }
          });
        },
      };
    },
  },
};

module.exports = { rules };
