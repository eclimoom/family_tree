/**
 * 族谱布局工具
 * 1. 按辈分严格分层（同辈同一行）
 * 2. 每个节点都是复合节点（夫妻或单人）
 * 3. 关系包含父子（上下层）、兄弟（同层）、夫妻（同一复合节点内）
 */

import { Core } from 'cytoscape';

// 布局默认配置常量
const DEFAULT_NODE_WIDTH = 160;
const DEFAULT_LAYOUT_CONFIG = {
  nodeSep: 50,      // 同层节点间距
  rankSep: 200,      // 层级间距
  coupleGap: 20,    // 夫妻之间的水平间距
  padding: 40,       // 布局内边距
};

// 类型定义
export interface NodeData {
  id: string;
  name?: string;
  birthDate?: string;
  deathDate?: string;
  birthAddress?: string;
  livingAddress?: string;
  gender?: string;
  isLiving?: boolean;
  portraitUrl?: string;
  spouse?: string;
  coupleId?: string;
  parent?: string;
  generation?: number;
  isGroup?: boolean;
  isCouple?: boolean;
}

export interface EdgeData {
  source: string;
  target: string;
  id?: string;
  relation?: string;
}

export interface Node {
  data: NodeData;
  classes?: string;
  selected?: boolean;
}

export interface Edge {
  data: EdgeData;
  classes?: string;
}

export interface OriginalData {
  nodes: Node[];
  edges: Edge[];
}

export interface TransformedData {
  nodes: Node[];
  edges: Edge[];
  nodeToGroup: Map<string, string>;
  groupsMap: Map<string, GroupInfo>;
}

export interface GroupInfo {
  groupId: string;
  isCouple: boolean;
  members: string[];
  generation: number;
}

export interface LayoutOptions {
  nodeSep?: number;
  rankSep?: number;
  coupleGap?: number;
  fit?: boolean;
  padding?: number;
  onStop?: (params: { cy: Core }) => void;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * 将原始节点和边转换为复合节点数据
 * - 夫妻合并为一个父容器，内部放置两个人
 * - 单人也放在一个父容器里，便于统一处理
 * - 生成父子、兄弟、夫妻三种关系边
 */
export function transformToGenealogyLayout(originalData: OriginalData = { nodes: [], edges: [] }): TransformedData {
  const nodes = originalData.nodes || [];
  const edges = originalData.edges || [];

  const personMap = new Map<string, Node>();
  nodes.forEach((node) => {
    if (node?.data?.id) {
      personMap.set(node.data.id, node);
    }
  });

  const nodeToGroup = new Map<string, string>();
  const groupsMap = new Map<string, GroupInfo>();
  const groupedNodes: Node[] = [];
  const memberNodes: Node[] = [];
  const spouseEdges: Edge[] = [];
  const processed = new Set<string>();

  // 1) 构建夫妻/单人复合节点
  nodes.forEach((node) => {
    const personId = node?.data?.id;
    if (!personId || processed.has(personId)) return;

    const spouseId = node.data.spouse;
    const spouseNode = spouseId ? personMap.get(spouseId) : null;

    if (spouseId && spouseNode && !processed.has(spouseId)) {
      // 夫妻组合一个复合节点
      const groupId =
        node.data.coupleId ||
        spouseNode.data.coupleId ||
        `couple_${personId}_${spouseId}`;
      const generation = inferGeneration(node.data, spouseNode.data);

      groupedNodes.push({
        data: {
          id: groupId,
          name: "",
          isGroup: true,
          isCouple: true,
          generation,
        },
        classes: "couple-group",
      });

      const pair = [node, spouseNode].map((member) => ({
        data: { ...member.data, parent: groupId, generation },
        classes: member.classes,
        selected: member.selected,
      }));

      pair.forEach((member) => {
        memberNodes.push(member);
        nodeToGroup.set(member.data.id!, groupId);
      });

      groupsMap.set(groupId, {
        groupId,
        isCouple: true,
        members: pair.map((m) => m.data.id!),
        generation,
      });

      // 夫妻边（用于语义展示，不影响层级）
      spouseEdges.push({
        data: {
          id: `spouse_${pair[0].data.id}_${pair[1].data.id}`,
          source: pair[0].data.id!,
          target: pair[1].data.id!,
          relation: "spouse",
        },
        classes: "couple-connection spouse-edge",
      });

      processed.add(personId);
      processed.add(spouseId);
    } else {
      // 单人也放在父容器里
      const groupId = `single_${personId}`;
      const generation = inferGeneration(node.data);

      groupedNodes.push({
        data: {
          id: groupId,
          name: "",
          isGroup: true,
          isCouple: false,
          generation,
        },
        classes: "single-group",
      });

      const member = {
        data: { ...node.data, parent: groupId, generation },
        classes: node.classes,
        selected: node.selected,
      };

      memberNodes.push(member);
      nodeToGroup.set(personId, groupId);
      groupsMap.set(groupId, {
        groupId,
        isCouple: false,
        members: [member.data.id!],
        generation,
      });

      processed.add(personId);
    }
  });

  // 2) 构建父子边，并记录兄弟关系
  const parentChildEdges: Edge[] = [];
  const parentToChildren = new Map<string, string[]>();
  const edgeKeys = new Set<string>();

  edges.forEach((edge) => {
    const source = edge?.data?.source;
    const target = edge?.data?.target;
    const sourceGroup = nodeToGroup.get(source);
    const targetGroup = nodeToGroup.get(target);

    if (!sourceGroup || !targetGroup || sourceGroup === targetGroup) return;

    const key = `${sourceGroup}->${targetGroup}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);

    parentChildEdges.push({
      data: {
        id: `edge_${sourceGroup}_${targetGroup}`,
        source: sourceGroup,
        target: targetGroup,
        relation: "parent-child",
      },
      classes: "parent-child",
    });

    if (!parentToChildren.has(sourceGroup)) {
      parentToChildren.set(sourceGroup, []);
    }
    parentToChildren.get(sourceGroup)!.push(targetGroup);
  });

  // 3) 兄弟边（同父母的孩子在同层并排）
  const siblingEdges: Edge[] = [];
  parentToChildren.forEach((children) => {
    const uniqueChildren = Array.from(new Set(children));
    if (uniqueChildren.length < 2) return;
    uniqueChildren.sort();

    for (let i = 0; i < uniqueChildren.length - 1; i++) {
      const from = uniqueChildren[i];
      const to = uniqueChildren[i + 1];
      const key = `sib_${from}_${to}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);

      siblingEdges.push({
        data: {
          id: key,
          source: from,
          target: to,
          relation: "sibling",
        },
        classes: "sibling-edge",
      });
    }
  });

  const newEdges = [...parentChildEdges, ...siblingEdges, ...spouseEdges];
  const newNodes = [...groupedNodes, ...memberNodes];

  return {
    nodes: newNodes,
    edges: newEdges,
    nodeToGroup,
    groupsMap,
  };
}

/**
 * 创建严格按辈分分层的布局配置
 */
export function createGenealogyLayout(transformedData: TransformedData, options: LayoutOptions = {}) {
  const {
    nodeSep = DEFAULT_LAYOUT_CONFIG.nodeSep,
    rankSep = DEFAULT_LAYOUT_CONFIG.rankSep,
    coupleGap = DEFAULT_LAYOUT_CONFIG.coupleGap,
    fit = true,
    padding = DEFAULT_LAYOUT_CONFIG.padding,
    onStop = null,
  } = options;

  const positions = buildLayerPositions(transformedData, {
    nodeSep,
    rankSep,
    coupleGap,
  });

  return {
    name: "preset",
    positions: (node: any) => positions[node.id()],
    fit,
    padding,
    animate: false,
    stop: function ({ cy }: { cy: Core }) {
      // 再次修正复合节点内部成员位置，保证夫妻左右排布
      arrangeCompoundNodePositions(cy, coupleGap);

      if (fit) {
        cy.fit(undefined, padding);
      }
      cy.center();

      if (onStop) {
        onStop({ cy });
      }
    },
  };
}

/**
 * 计算每个复合节点（家单元）的位置，并将其子节点安放在内部
 */
function buildLayerPositions(transformedData: TransformedData, layoutOptions: { nodeSep: number; rankSep: number; coupleGap: number }): Record<string, Position> {
  const { nodeSep, rankSep, coupleGap } = layoutOptions;
  const nodes = transformedData.nodes || [];
  const edges = transformedData.edges || [];

  const groupNodes = nodes.filter((n) => n?.data?.isGroup);
  const personNodes = nodes.filter((n) => n?.data?.parent);

  const groupMap = new Map<string, Node>(groupNodes.map((n) => [n.data.id!, n]));
  const childrenMap = new Map<string, string[]>();
  const indegree = new Map<string, number>();

  groupNodes.forEach((node) => indegree.set(node.data.id!, 0));

  edges.forEach((edge) => {
    if (edge?.data?.relation !== "parent-child") return;
    const src = edge.data.source;
    const tgt = edge.data.target;
    if (!groupMap.has(src) || !groupMap.has(tgt)) return;

    if (!childrenMap.has(src)) childrenMap.set(src, []);
    childrenMap.get(src)!.push(tgt);
    indegree.set(tgt, (indegree.get(tgt) || 0) + 1);
  });

  const roots = Array.from(groupMap.keys()).filter(
    (id) => (indegree.get(id) || 0) === 0
  );
  roots.sort();

  const subtreeWidth = new Map<string, number>();
  const baseWidth = Math.max(DEFAULT_NODE_WIDTH, coupleGap);

  function measure(id: string): number {
    const kids = childrenMap.get(id) || [];
    if (!kids.length) {
      subtreeWidth.set(id, baseWidth);
      return baseWidth;
    }

    const widths = kids.map((kid) => measure(kid));
    const total = widths.reduce((sum, w) => sum + w, 0) + (kids.length - 1) * nodeSep;
    const width = Math.max(baseWidth, total);
    subtreeWidth.set(id, width);
    return width;
  }

  roots.forEach((root) => measure(root));

  const generations = Array.from(
    new Set(groupNodes.map((n) => n.data.generation || 0))
  ).sort((a, b) => a - b);
  const genIndex = new Map<number, number>(generations.map((gen, idx) => [gen, idx]));

  const positions: Record<string, Position> = {};
  let cursor = 0;

  roots.forEach((root) => {
    const width = subtreeWidth.get(root) || baseWidth;
    assign(root, cursor);
    cursor += width + nodeSep * 2;
  });

  function assign(id: string, left: number) {
    const node = groupMap.get(id);
    if (!node) return;

    const width = subtreeWidth.get(id) || baseWidth;
    const gen = node.data.generation || 0;
    const row = genIndex.get(gen) ?? 0;

    const centerX = left + width / 2;
    const centerY = row * rankSep;
    positions[id] = { x: centerX, y: centerY };

    const kids = childrenMap.get(id) || [];
    if (!kids.length) return;

    const childWidths = kids.map((kid) => subtreeWidth.get(kid) || baseWidth);
    const total =
      childWidths.reduce((sum, w) => sum + w, 0) + (kids.length - 1) * nodeSep;
    let childLeft = left + (width - total) / 2;

    kids.forEach((kid, idx) => {
      assign(kid, childLeft);
      childLeft += childWidths[idx] + nodeSep;
    });
  }

  // 将个人节点放入对应的复合节点内部
  const childrenByParent = new Map<string, Node[]>();
  personNodes.forEach((person) => {
    const parentId = person.data.parent;
    if (!parentId) return;
    if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
    childrenByParent.get(parentId)!.push(person);
  });

  childrenByParent.forEach((members, parentId) => {
    const parentPos = positions[parentId];
    if (!parentPos) return;

    const sortedMembers = members.slice().sort(sortByGenderThenId);
    if (sortedMembers.length === 1) {
      positions[sortedMembers[0].data.id!] = {
        x: parentPos.x,
        y: parentPos.y,
      };
      return;
    }

    const gap = coupleGap;
    const startX = parentPos.x - ((sortedMembers.length - 1) * gap) / 2;
    sortedMembers.forEach((member, idx) => {
      positions[member.data.id!] = {
        x: startX + idx * gap,
        y: parentPos.y,
      };
    });
  });

  return positions;
}

/**
 * 复合节点内部的夫妻/单人重新对齐
 *（防止外部操作导致偏移）
 */
export function arrangeCompoundNodePositions(cy: Core, coupleGap: number) {
  cy.nodes(":parent").forEach((parentNode: any) => {
    const children = parentNode.children();
    const pos = parentNode.position();

    if (children.length === 0) return;
    const sorted = children.sort(sortByGenderThenId);

    if (sorted.length === 1) {
      sorted[0].position({ x: pos.x, y: pos.y });
      parentNode.position(pos);
      return;
    }

    const gap = coupleGap || DEFAULT_NODE_WIDTH;
    const startX = pos.x - ((sorted.length - 1) * gap) / 2;

    sorted.forEach((child: any, idx: number) => {
      child.position({
        x: startX + idx * gap,
        y: pos.y,
      });
    });

    parentNode.position(pos);
  });
}

function inferGeneration(...datas: NodeData[]): number {
  let generation: number | null = null;
  datas.forEach((data) => {
    const value = readGeneration(data);
    if (value !== null && (generation === null || value < generation)) {
      generation = value;
    }
  });
  return generation ?? 0;
}

function readGeneration(data: NodeData): number | null {
  if (!data) return null;
  if (typeof data.generation === "number") return data.generation;

  if (typeof data.id === "string") {
    const match = data.id.match(/gen(\d+)/i);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function sortByGenderThenId(a: any, b: any): number {
  const genderScore = genderWeight(a?.data?.gender) - genderWeight(b?.data?.gender);
  if (genderScore !== 0) return genderScore;

  const idA = a?.data?.id || "";
  const idB = b?.data?.id || "";
  return idA.localeCompare(idB);
}

function genderWeight(gender?: string): number {
  if (!gender) return 2;
  if (gender === "男" || gender === "male" || gender === "M") return 0;
  if (gender === "女" || gender === "female" || gender === "F") return 1;
  return 2;
}
