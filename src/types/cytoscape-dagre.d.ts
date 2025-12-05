declare module 'cytoscape-dagre' {
  import { Core } from 'cytoscape';
  
  function dagre(cytoscape: (opts?: any) => Core): void;
  export default dagre;
}

