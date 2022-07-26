const [DONE_WITH_TREE, DONE_WITH_SUBTREE] = [1, 2];

function traverseTree(node, visitorKeys, callback) {
  const stack = [[node, null, null]];

  while (stack.length > 0) {
    try {
      const current = stack.shift();
      const [currentNode] = current;

      callback(...current);

      for (const visitorKey of visitorKeys[currentNode.type] ?? []) {
        const child = currentNode[visitorKey];

        if (Array.isArray(child)) {
          for (const childItem of child) {
            stack.push([childItem, currentNode, visitorKey]);
          }
        } else if (Boolean(child)) {
          stack.push([child, currentNode, visitorKey]);
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

              traverseTree(child, visitorKeys, (current) => {
                if (current.type === 'JSXElement') {
                  flag = true;

                  throw DONE_WITH_TREE;
                }
              });

              return flag;
            })
            .filter((child) => {
              let flag = false;

              traverseTree(child, visitorKeys, (current) => {
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
                  [/Provider$/].every(
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
                  )
                ) {
                  flag = true;

                  throw DONE_WITH_TREE;
                }
              });

              return flag;
            });

          const components = componentNodes
            .map(
              (child) =>
                child?.id?.value ??
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
            componentNode?.id?.value ??
            componentNode?.declarations?.map(
              (declaration) => declaration?.id?.name,
            );

          let fixNode = null;

          traverseTree(componentNode, visitorKeys, (current) => {
            if (
              current.type === 'JSXElement' &&
              [/Provider$/].every(
                (regex) =>
                  !regex.test(
                    current.openingElement.name.property
                      ? current.openingElement.name.property.name
                      : current.openingElement.name.name,
                  ),
              ) &&
              !current.openingElement.attributes.find(
                (attributeNode) => attributeNode.name.name === 'data-component',
              )
            ) {
              fixNode = current.openingElement;

              throw DONE_WITH_TREE;
            }
          });

          if (Boolean(components)) {
            context.report({
              node: componentNode,
              message: `These components are missing data-component attributes for top-level elements: ${components}`,
              fix: (fixer) =>
                fixer.insertTextAfterRange(
                  fixNode.name.range,
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
