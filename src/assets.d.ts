// 声明静态资源文件类型，允许 TypeScript 导入图片等资源
declare module '*.png' {
  const value: string;
  export default value;
}

// 声明 JSON 模块类型
declare module '*.json' {
  const value: any;
  export default value;
}

