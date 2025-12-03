import cytoscape from "cytoscape";
import data from "../mock/data.json";
import dagre from "cytoscape-dagre";
import $ from "jquery";
import { transformToGenealogyLayout, createGenealogyLayout } from "./genealogy-layout.js";
cytoscape.use(dagre);

// 使用 new URL() 方式导入图片（Parcel 2 推荐方式）
const male = new URL('../assets/male.png', import.meta.url).href;
const female = new URL('../assets/female.png', import.meta.url).href;

// 节点和布局配置常量
const NODE_CONFIG = {
  width: 100,        // 节点宽度
  height: 50,        // 节点高度
  padding: 10,       // 节点内边距（px）
};

const LAYOUT_CONFIG = {
  nodeSep: 40,      // 同一层级节点间距
  rankSep: 130,      // 辈分间距
  coupleGap: 110,    // 夫妻左右间距
  padding: 40,       // 布局内边距
  initialZoom: 0.9,  // 初始缩放比例
};

const styles = [
  {
    selector: "node",
    style: {
      label: "data(name)",
      "text-wrap": "wrap",
      "text-valign": "center",
      "background-color": "white",
      "background-opacity": 0.5,
      height: NODE_CONFIG.height,
      width: NODE_CONFIG.width,
      shape: "roundrectangle", //cutrectangle roundrectangle
    },
  },
  {
    selector: "node:parent", // 复合节点（夫妻组）
    style: {
      "background-color": "transparent",
      "background-opacity": 0,
      "border-width": 0,
      "padding": `${NODE_CONFIG.padding}px`,
    },
  },
  {
    selector: "node.couple-group", // 夫妻组容器
    style: {
      "background-color": "transparent",
      "background-opacity": 0,
      "border-width": 0,
    },
  },
  {
    selector: ":selected",
    style: {
      label: "data(name)",
      "text-valign": "center",
      color: "#ffffff",
      // "text-outline-color": "#242048",
      // "text-outline-width": 1,
      "background-color": "#242048",
    },
  },

  {
    selector: "edge",
    style: {
      "curve-style": "bezier",
      width: 2,
      "line-color": "#a9a8ba",
      "target-arrow-color": "#CECECE",
    },
  },
  {
    selector: "edge.parent-child",
    style: {
      "curve-style": "taxi",
      "taxi-direction": "vertical",
      "taxi-turn": "30",
      width: 2,
      "target-arrow-shape": "triangle",
      "target-arrow-color": "#a9a8ba",
    },
  },
  {
    selector: "edge.sibling-edge",
    style: {
      "curve-style": "straight",
      "line-style": "dashed",
      width: 1,
      "line-color": "#c7c4d4",
      "target-arrow-shape": "none",
    },
  },
  {
    selector: "edge.spouse-edge",
    style: {
      "curve-style": "straight",
      width: 1,
      "line-color": "#b3b0c5",
      "target-arrow-shape": "none",
    },
  },
  {
    selector: "edge.taxi-female",
    style: {
      "line-color": "#743635",
      // "taxi-direction": "vertical",
      // "line-style": "dashed",
      width: 1,
      "line-opacity": 0.4,
    },
  },
  {
    selector: "edge.couple-connection",
    style: {
      "line-color": "transparent",
      "line-opacity": 0,
      width: 0,
      "target-arrow-shape": "none",
    },
  },
];

// 转换数据以支持族谱布局（夫妻分组）
const transformedData = transformToGenealogyLayout(data);
console.log("转换后的节点数:", transformedData.nodes.length);
console.log("转换后的边数:", transformedData.edges.length);

// 创建族谱布局配置（按辈分分层 + 复合节点）
let layout = createGenealogyLayout(transformedData, {
  nodeSep: LAYOUT_CONFIG.nodeSep,
  rankSep: LAYOUT_CONFIG.rankSep,
  coupleGap: LAYOUT_CONFIG.coupleGap,
  fit: true,
  padding: LAYOUT_CONFIG.padding,
  onStop: function ({ cy }) {
    cy.zoom(LAYOUT_CONFIG.initialZoom);
    cy.center();
    let node = cy.$(":selected");
    // 检查节点是否存在且不是空集合
    if (node && node.length > 0) {
      let data = node.data();
      // 确保 data 存在且有 name 属性
      if (data && data.name) {
        handleSelected(data);
      }
    }
    // 渲染代系数标签
    renderGenerationLabels(cy);
  },
});

const _$editor = $("#profile-editor");
const _$profile = $("#profile");
const $avatar = _$profile.find("#avatar");
const $name = _$profile.find(".name");
const $lifespa = _$profile.find(".lifespa");
const $gender = _$editor.find("input:radio[name='gender']");
const $fname = _$editor.find("#fname");
const $birthdate = _$editor.find("#birthdate");
const $birthAddress = _$editor.find("#birthAddress");
const $livingAddress = _$editor.find("#livingAddress");
const $userId = $("#user-id");

let cy = cytoscape({
  container: document.getElementById("cy"),
  boxSelectionEnabled: false,
  autounselectify: false,
  style: styles,
  elements: transformedData, // 使用转换后的数据
  selectionType: 'single',
  layout,
});


cy.on('tap', 'node', function(evt){
    const node = evt.target;
    // 处理所有节点的点击（不再有复合节点）
    handleSelected(node.data());
});

/**
 * const userInfo = {
 *  id: "1712139752",
 *  name: "jerry",
 *  birthDate: null,
 *  deathDate: null,
 *  // families: [],
 *  gender: "男",
 *  isLiving: true,
 *  portraitUrl: null,
 * };
*/

$userId.text('您好, 9527');
function handleSelected(data) {
  // 确保 data 存在
  if(!data) {
    console.warn("handleSelected: data is undefined");
    return;
  }
  setUserInfo(data);
  
}
function setUserInfo(data) {
  // 处理 data 为 undefined 或空对象的情况
  if(!data) {
    data = {};
  }
  let { name = '', gender = '', birthDate = '', isLiving = true, deathDate = '', birthAddress = '', livingAddress = '', families = [] } = data;
  $fname.val(name || '');
  $name.text(name || '');
  $lifespa.text(isLiving ? "在世": "过世");
  let _g = ["男", "女"].includes(gender) ? gender : "未知";
  // 先取消所有选中，再选中对应的性别
  // 对于 Bootstrap 按钮组，需要移除所有 active 类，然后设置 checked 并触发 change 事件
  $gender.closest('.btn-group').find('.btn').removeClass('active');
  $gender.prop("checked", false);
  const $selectedGender = $gender.filter(`[value="${_g}"]`);
  $selectedGender.prop("checked", true);
  // 触发 change 事件，让 Bootstrap 更新按钮样式
  $selectedGender.trigger('change');
  // 手动添加 active 类以确保按钮显示为选中状态
  $selectedGender.closest('label.btn').addClass('active');
  $birthdate.val(birthDate);
  $birthAddress.val(birthAddress);
  $livingAddress.val(livingAddress);
  // 根据性别使用默认头像
  let _portraitUrl = _g == "女" ? female : male;
  console.log(name);
  
  $avatar.attr("src", _portraitUrl);
}

// 当前状态
let stepName = '';
function addRelation() {
  stepName = 'add';
  // 1.隐藏tools
  $('.user-wrap').addClass('add-relation');
  setUserInfo({});
}
// 添加关系
$('body').on('click', '.add-relation-btn', function(){
  addRelation();
}).on('click', '#back-btn', function(){
  let node = cy.$(":selected");
    if(node && node.length > 0){
      let data = node.data();
      if(data && data.name){
        $('.user-wrap').removeClass('add-relation');
        handleSelected(data);
      }
    }else {
      console.log("no select user!");
    }
});

// 处理性别按钮点击，确保选中状态正确切换
$gender.on('change', function() {
  // 移除所有按钮的 active 类
  $gender.closest('.btn-group').find('.btn').removeClass('active');
  // 为选中的按钮添加 active 类
  $(this).closest('label.btn').addClass('active');
});

/**
 * 渲染代系数标签
 * 在画布左侧显示代系数，与族谱布局的代系线对齐
 */
function renderGenerationLabels(cy) {
  const $labelsContainer = $('#generation-labels');
  $labelsContainer.empty();

  // 收集所有代系及其节点引用
  // 使用实际显示的节点（非复合节点）来获取Y坐标，这样能准确对齐
  const generationMap = new Map();
  
  // 遍历所有实际显示的节点（非复合节点），获取代系信息
  cy.nodes(':not(:parent)').forEach((node) => {
    const generation = node.data('generation');
    if (generation !== undefined && generation !== null) {
      // 存储节点引用，以便后续获取实时渲染位置
      if (!generationMap.has(generation)) {
        generationMap.set(generation, [node]);
      } else {
        generationMap.get(generation).push(node);
      }
    }
  });

  // 按代系排序
  const sortedGenerations = Array.from(generationMap.entries()).sort((a, b) => a[0] - b[0]);

  // 创建代系数标签，存储节点引用以便实时更新位置
  sortedGenerations.forEach(([generation, nodes]) => {
    const $label = $('<div>')
      .addClass('generation-label')
      .text(`${generation}`)
      .data('generation', generation)
      .data('referenceNodes', nodes); // 存储节点引用
    
    $labelsContainer.append($label);
  });

  // 更新标签位置
  updateGenerationLabelsPosition(cy);
}

/**
 * 更新代系数标签的位置
 * 使用实际节点的渲染位置来对齐标签
 */
function updateGenerationLabelsPosition(cy) {
  const $labels = $('#generation-labels .generation-label');
  const container = cy.container();
  const containerRect = container.getBoundingClientRect();
  
  $labels.each(function() {
    const $label = $(this);
    const referenceNodes = $label.data('referenceNodes');
    
    if (referenceNodes && referenceNodes.length > 0) {
      // 计算该代系所有节点的平均渲染Y坐标
      let totalY = 0;
      let count = 0;
      
      referenceNodes.forEach((node) => {
        if (node && node.length > 0) {
          const renderedPos = node.renderedPosition();
          if (renderedPos && renderedPos.y !== undefined) {
            totalY += renderedPos.y;
            count++;
          }
        }
      });
      
      if (count > 0) {
        // renderedPosition 返回的坐标已经包含容器偏移，直接使用即可
        const averageY = totalY / count;
        const screenY = averageY;
        $label.css('top', `${screenY}px`);
      }
    }
  });
}

// 监听画布的缩放和平移事件，更新代系数标签位置
cy.on('pan zoom', function() {
  updateGenerationLabelsPosition(cy);
});

// 监听窗口大小变化
$(window).on('resize', function() {
  updateGenerationLabelsPosition(cy);
});

// 处理复合节点的拖拽：子节点可以被选中，但拖拽时移动整个复合节点
let draggedParentNode = null;
let dragStartParentPos = null;
let dragStartChildPos = null;

cy.on('grab', 'node', function(evt) {
  const node = evt.target;
  
  // 如果是子节点（有父节点），记录父节点和初始位置
  if (node.isChild()) {
    const parentNode = node.parent();
    if (parentNode && parentNode.length > 0) {
      draggedParentNode = parentNode;
      dragStartParentPos = { ...parentNode.position() };
      dragStartChildPos = { ...node.position() };
    }
  }
});

cy.on('drag', 'node', function(evt) {
  const node = evt.target;
  
  // 如果拖拽的是子节点，阻止子节点移动，改为移动父节点
  if (node.isChild() && draggedParentNode) {
    const parentNode = node.parent();
    if (parentNode && parentNode.id() === draggedParentNode.id()) {
      // 获取子节点当前的位置（已经被拖拽移动了）
      const currentChildPos = node.position();
      
      // 计算子节点的移动偏移量
      const deltaX = currentChildPos.x - dragStartChildPos.x;
      const deltaY = currentChildPos.y - dragStartChildPos.y;
      
      // 将子节点位置重置回初始位置
      node.position(dragStartChildPos);
      
      // 移动父节点
      const newParentPos = {
        x: dragStartParentPos.x + deltaX,
        y: dragStartParentPos.y + deltaY
      };
      parentNode.position(newParentPos);
      
      // 更新所有子节点的位置，保持相对位置
      const children = parentNode.children();
      const sorted = children.toArray().sort((a, b) => {
        const genderA = a.data('gender') || '';
        const genderB = b.data('gender') || '';
        const genderScore = genderWeight(genderA) - genderWeight(genderB);
        if (genderScore !== 0) return genderScore;
        return (a.data('id') || '').localeCompare(b.data('id') || '');
      });
      
      if (sorted.length === 1) {
        sorted[0].position(newParentPos);
      } else {
        const gap = LAYOUT_CONFIG.coupleGap;
        const startX = newParentPos.x - ((sorted.length - 1) * gap) / 2;
        sorted.forEach((child, idx) => {
          child.position({
            x: startX + idx * gap,
            y: newParentPos.y,
          });
        });
      }
      
      // 更新拖拽起始位置，以便下次拖拽时使用
      dragStartParentPos = { ...newParentPos };
      dragStartChildPos = { ...node.position() };
    }
  }
});

cy.on('free', 'node', function(evt) {
  const node = evt.target;
  
  // 拖拽结束后，清理状态并重新对齐
  if (draggedParentNode && node.isChild()) {
    const parentNode = node.parent();
    if (parentNode && parentNode.id() === draggedParentNode.id()) {
      // 重新对齐复合节点内部位置
      arrangeCompoundNodePositions(cy, LAYOUT_CONFIG.coupleGap);
    }
  }
  
  draggedParentNode = null;
  dragStartParentPos = null;
  dragStartChildPos = null;
});

// 需要导入 arrangeCompoundNodePositions 函数，或者在这里重新实现
// 由于 arrangeCompoundNodePositions 在 genealogy-layout.js 中，我们需要在这里实现一个简化版本
function arrangeCompoundNodePositions(cy, coupleGap) {
  cy.nodes(":parent").forEach((parentNode) => {
    const children = parentNode.children();
    const pos = parentNode.position();

    if (children.length === 0) return;
    const sorted = children.toArray().sort((a, b) => {
      const genderA = a.data('gender') || '';
      const genderB = b.data('gender') || '';
      const genderScore = genderWeight(genderA) - genderWeight(genderB);
      if (genderScore !== 0) return genderScore;
      return (a.data('id') || '').localeCompare(b.data('id') || '');
    });

    if (sorted.length === 1) {
      sorted[0].position({ x: pos.x, y: pos.y });
      parentNode.position(pos);
      return;
    }

    const gap = coupleGap || 120;
    const startX = pos.x - ((sorted.length - 1) * gap) / 2;

    sorted.forEach((child, idx) => {
      child.position({
        x: startX + idx * gap,
        y: pos.y,
      });
    });

    parentNode.position(pos);
  });
}

function genderWeight(gender) {
  if (!gender) return 2;
  if (gender === "男" || gender === "male" || gender === "M") return 0;
  if (gender === "女" || gender === "female" || gender === "F") return 1;
  return 2;
}
