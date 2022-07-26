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
  return node.type === 'VariableDeclaration'
    ? node.declarations?.[0]?.init?.body?.body?.find(
        (statement) => statement.type === 'ReturnStatement',
      ) ??
        (node.declarations?.[0]?.init?.body?.type === 'JSXElement'
          ? node.declarations?.[0]?.init?.body
          : null)
    : node.body?.body?.find(
        (statement) => statement.type === 'ReturnStatement',
      );
}

function isInNestedReturnStatement(ancestors, returnStatement) {
  const nestedReturnStatementIndex = ancestors.findIndex(
    (ancestor, index) =>
      (ancestor.type === 'ReturnStatement' ||
        (ancestor.type === 'JSXElement' &&
          ancestors[index + 1]?.type === 'ArrowFunctionExpression')) &&
      ancestor !== returnStatement,
  );

  const originalReturnStatementIndex = ancestors.findIndex(
    (ancestor) => ancestor === returnStatement,
  );

  return (
    nestedReturnStatementIndex !== -1 &&
    originalReturnStatementIndex !== -1 &&
    originalReturnStatementIndex > nestedReturnStatementIndex
  );
}

function isInNestedFunction(ancestors, returnStatement) {
  const nestedFunctionIndex = ancestors.findIndex(
    (ancestor) =>
      ancestor.type === 'ArrowFunctionExpression' ||
      ancestor.type === 'FunctionDeclaration',
  );

  const originalReturnStatementIndex = ancestors.findIndex(
    (ancestor) => ancestor === returnStatement,
  );

  return (
    nestedFunctionIndex !== -1 &&
    originalReturnStatementIndex !== -1 &&
    originalReturnStatementIndex > nestedFunctionIndex
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
            .map((child) => child?.declaration ?? child)
            .filter(
              (child) =>
                child.type === 'VariableDeclaration' ||
                child.type === 'FunctionDeclaration',
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
                (current, ancestors) => {
                  if (
                    current.type === 'JSXElement' &&
                    current.openingElement.attributes.find(
                      (attributeNode) =>
                        attributeNode.name.name === 'data-component',
                    )
                  ) {
                    throw DONE_WITH_SUBTREE;
                  } else if (
                    current.type === 'JSXElement' &&
                    excludeComponentNames.every(
                      (regex) =>
                        !regex.test(
                          current.openingElement.name.property
                            ? current.openingElement.name.property.name
                            : current.openingElement.name.name,
                        ),
                    ) &&
                    !current.openingElement.attributes.find(
                      (attributeNode) =>
                        attributeNode.name.name === 'data-component',
                    ) &&
                    (isInNestedReturnStatement(
                      ancestors,
                      getReturnStatement(child),
                    ) ||
                      !isInNestedFunction(ancestors, getReturnStatement(child)))
                  ) {
                    flag = true;

                    throw DONE_WITH_TREE;
                  }
                },
              );

              return flag;
            });

          const components = componentNodes
            .map(
              (child) =>
                child?.id?.name ??
                child?.declarations?.map(
                  (declaration) => declaration?.id?.name,
                ),
            )
            .reduce(
              (previous, current) =>
                current ? previous.concat(current) : previous,
              [],
            )
            .join(', ');

          const [componentNode] = componentNodes;

          const componentName =
            componentNode?.id?.name ??
            componentNode?.declarations?.map(
              (declaration) => declaration?.id?.name,
            );

          let fixNode = null;

          traverseTree(
            getReturnStatement(componentNode),
            visitorKeys,
            (current, ancestors) => {
              if (
                current.type === 'JSXElement' &&
                excludeComponentNames.every(
                  (regex) =>
                    !regex.test(
                      current.openingElement.name.property
                        ? current.openingElement.name.property.name
                        : current.openingElement.name.name,
                    ),
                ) &&
                !current.openingElement.attributes.find(
                  (attributeNode) =>
                    attributeNode.name.name === 'data-component',
                ) &&
                (isInNestedReturnStatement(
                  ancestors,
                  getReturnStatement(componentNode),
                ) ||
                  !isInNestedFunction(
                    ancestors,
                    getReturnStatement(componentNode),
                  ))
              ) {
                fixNode = current.openingElement;

                throw DONE_WITH_TREE;
              }
            },
          );

          if (Boolean(components)) {
            context.report({
              node: componentNode,
              message: `These components are missing data-component attributes for top-level elements: ${components}`,
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
        },
      };
    },
  },
};

module.exports = { rules };
