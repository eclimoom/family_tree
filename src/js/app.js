import cytoscape from "cytoscape";
import data from "../mock/data.json";
import dagre from "cytoscape-dagre";
import $ from "jquery";
cytoscape.use(dagre);

// 使用 new URL() 方式导入图片（Parcel 2 推荐方式）
const male = new URL('../assets/male.png', import.meta.url).href;
const female = new URL('../assets/female.png', import.meta.url).href;

const styles = [
  {
    selector: "node",
    style: {
      label: "data(name)",
      "text-wrap": "wrap",
      "text-valign": "center",
      "background-color": "white",
      "background-opacity": 0.5,
      height: 82,
      width: 142,
      shape: "roundrectangle", //cutrectangle roundrectangle
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
      "curve-style": "taxi",
      "taxi-direction": "vertical", //['horizontal', 'leftward', 'rightward', 'vertical', 'upward', 'downward', 'auto']
      "taxi-turn": "30",
      width: 2,
      // "target-arrow-shape": "triangle",
      "line-color": "#a9a8ba",
      "target-arrow-color": "#CECECE",
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
];

let layout = {
  name: "dagre", // breadthfirst
  // dagre algo options, uses default value on undefined
  // nodeSep: 50, // the separation between adjacent nodes in the same rank
  // edgeSep: 100, // the separation between adjacent edges in the same rank
  // rankSep: 50, // the separation between each rank in the layout
  rankDir: "TB", // 'TB' for top to bottom flow, 'LR' for left to right,
  // avoidOverlap: false,
  // align: undefined, // alignment for rank nodes. Can be 'UL', 'UR', 'DL', or 'DR', where U = up, D = down, L = left, and R = right
  // acyclicer: "greedy", // If set to 'greedy', uses a greedy heuristic for finding a feedback arc set for a graph.
  // // A feedback arc set is a set of edges that can be removed to make a graph acyclic.
  ranker: "tight-tree", // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
  // // general layout options
  fit: true, // whether to fit to viewport
  padding: 50,
  stop: function ({ cy }) {
    cy.zoom(0.8);
    cy.center();
    let node = cy.$(":selected");
    if(node){
      let data = node.data();      
      handleSelected(data);
    }else {
      console.log("no select user!");
    }
  },
};

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
  elements: data,
  selectionType: 'single',
  layout,
});


cy.on('tap', 'node', function(evt){
    const node = evt.target;
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
  setUserInfo(data);
  
}
function setUserInfo(data) {
  let { name, gender, birthDate, isLiving, deathDate, birthAddress, livingAddress, families } = data;
  $fname.val(name);
  $name.text(name);
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
  console.log(_portraitUrl, 'portraitUrl', _g);
  
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
    if(node){
      let data = node.data();
      $('.user-wrap').removeClass('add-relation');
      handleSelected(data);
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
