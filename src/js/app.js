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
  nodeSep: 50,      // 同一层级节点间距
  rankSep: 150,      // 辈分间距
  coupleGap: 120,    // 夫妻左右间距
  padding: 80,       // 布局内边距
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
