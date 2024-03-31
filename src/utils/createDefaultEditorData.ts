export type IScratchEditorData = Array<{
  text: string;
  element?: keyof HTMLElementTagNameMap;
}>;

export const createDefaultEditorData = (data: IScratchEditorData) => {
  return data
    .map(
      (item) =>
        `<${item.element ?? 'p'}>
    ${item.text}
    </${item.element ?? 'p'}>
    `,
    )
    .join('\n');
};
