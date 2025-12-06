import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import cytoscape, { Core, EventObject, NodeSingular } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { GenealogyStoreService, Genealogy } from '../../services/genealogy-store.service';
import { transformToGenealogyLayout, createGenealogyLayout, arrangeCompoundNodePositions } from '../../genealogy-layout';
import { OriginalData } from '../../genealogy-layout';

cytoscape.use(dagre);

const NODE_CONFIG = {
  width: 100,
  height: 50,
  padding: 10,
};

const LAYOUT_CONFIG = {
  nodeSep: 40,
  rankSep: 130,
  coupleGap: 110,
  padding: 40,
  initialZoom: 0.9,
};

@Component({
  selector: 'app-genealogy-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './genealogy.page.html',
  styleUrl: './genealogy.page.scss',
})
export class GenealogyPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cyContainer', { static: false }) cyContainer!: ElementRef<HTMLDivElement>;

  cy: Core | null = null;
  stepName = '';
  draggedParentNode: any = null;
  dragStartParentPos: { x: number; y: number } | null = null;
  dragStartChildPos: { x: number; y: number } | null = null;
  currentTree: Genealogy | undefined;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: GenealogyStoreService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const treeId = params.get('id') || 'default';
      this.currentTree = this.store.getTree(treeId) || this.store.getTree('default');
      if (!this.currentTree) {
        this.router.navigate(['/trees']);
        return;
      }
      if (this.cy) {
        this.cy.destroy();
        this.cy = null;
      }
      if (this.cyContainer) {
        setTimeout(() => this.initCytoscape(), 0);
      }
    });
    const userIdElement = document.getElementById('user-id');
    if (userIdElement) {
      userIdElement.textContent = '您好, 9527';
    }
  }

  ngAfterViewInit() {
    this.initCytoscape();
    this.setupEventListeners();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.updateOnResize);
    if (this.cy) {
      this.cy.destroy();
    }
  }

  private initCytoscape() {
    const container = document.getElementById('cy');
    if (!container || !this.currentTree) {
      return;
    }

    const origin: OriginalData = {
      nodes: this.currentTree.nodes || [],
      edges: this.currentTree.edges || [],
    } as OriginalData;

    const transformedData = transformToGenealogyLayout(origin as any);

    const layout = createGenealogyLayout(transformedData, {
      nodeSep: LAYOUT_CONFIG.nodeSep,
      rankSep: LAYOUT_CONFIG.rankSep,
      coupleGap: LAYOUT_CONFIG.coupleGap,
      fit: true,
      padding: LAYOUT_CONFIG.padding,
      onStop: ({ cy }) => {
        cy.zoom(LAYOUT_CONFIG.initialZoom);
        cy.center();
        const node = cy.$(':selected');
        if (node && node.length > 0) {
          const nodeData = node.data();
          if (nodeData && nodeData.name) {
            this.handleSelected(nodeData);
          }
        }
        this.renderGenerationLabels(cy);
      },
    });

    const styles: any = [
      {
        selector: 'node',
        style: {
          label: 'data(name)',
          'text-wrap': 'wrap',
          'text-valign': 'center',
          'background-color': 'white',
          'background-opacity': 0.5,
          height: NODE_CONFIG.height,
          width: NODE_CONFIG.width,
          shape: 'roundrectangle',
        },
      },
      {
        selector: 'node:parent',
        style: {
          'background-color': 'transparent',
          'background-opacity': 0,
          'border-width': 0,
          padding: `${NODE_CONFIG.padding}px`,
        },
      },
      {
        selector: 'node.couple-group',
        style: {
          'background-color': 'transparent',
          'background-opacity': 0,
          'border-width': 0,
        },
      },
      {
        selector: ':selected',
        style: {
          label: 'data(name)',
          'text-valign': 'center',
          color: '#ffffff',
          'background-color': '#242048',
        },
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          width: 2,
          'line-color': '#a9a8ba',
          'target-arrow-color': '#CECECE',
        },
      },
      {
        selector: 'edge.parent-child',
        style: {
          'curve-style': 'taxi',
          'taxi-direction': 'vertical',
          'taxi-turn': '30',
          width: 2,
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#a9a8ba',
        },
      },
      {
        selector: 'edge.sibling-edge',
        style: {
          'curve-style': 'straight',
          'line-style': 'dashed',
          width: 1,
          'line-color': '#c7c4d4',
          'target-arrow-shape': 'none',
        },
      },
      {
        selector: 'edge.spouse-edge',
        style: {
          'curve-style': 'straight',
          width: 1,
          'line-color': '#b3b0c5',
          'target-arrow-shape': 'none',
        },
      },
      {
        selector: 'edge.taxi-female',
        style: {
          'line-color': '#743635',
          width: 1,
          'line-opacity': 0.4,
        },
      },
      {
        selector: 'edge.couple-connection',
        style: {
          'line-color': 'transparent',
          'line-opacity': 0,
          width: 0,
          'target-arrow-shape': 'none',
        },
      },
    ];

    this.cy = cytoscape({
      container,
      boxSelectionEnabled: false,
      autounselectify: false,
      style: styles,
      elements: transformedData,
      selectionType: 'single',
      layout: layout as any,
    });

    this.renderGenerationLabels(this.cy);

    this.cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      this.handleSelected(node.data());
    });

    this.cy.on('grab', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      if ((node as any).isChild && (node as any).isChild()) {
        const parentNode = (node as any).parent();
        if (parentNode && parentNode.length > 0) {
          this.draggedParentNode = parentNode;
          this.dragStartParentPos = { ...parentNode.position() };
          this.dragStartChildPos = { ...node.position() };
        }
      }
    });

    this.cy.on('drag', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      if ((node as any).isChild && (node as any).isChild() && this.draggedParentNode) {
        const parentNode = (node as any).parent();
        if (parentNode && parentNode.id() === this.draggedParentNode.id()) {
          const currentChildPos = node.position();
          const deltaX = currentChildPos.x - (this.dragStartChildPos?.x || 0);
          const deltaY = currentChildPos.y - (this.dragStartChildPos?.y || 0);
          node.position(this.dragStartChildPos!);
          const newParentPos = {
            x: (this.dragStartParentPos?.x || 0) + deltaX,
            y: (this.dragStartParentPos?.y || 0) + deltaY,
          };
          parentNode.position(newParentPos);
          const children = parentNode.children();
          const sorted = children.toArray().sort((a: any, b: any) => {
            const genderA = a.data('gender') || '';
            const genderB = b.data('gender') || '';
            const genderScore = this.genderWeight(genderA) - this.genderWeight(genderB);
            if (genderScore !== 0) return genderScore;
            return (a.data('id') || '').localeCompare(b.data('id') || '');
          });

          if (sorted.length === 1) {
            sorted[0].position(newParentPos);
          } else {
            const gap = LAYOUT_CONFIG.coupleGap;
            const startX = newParentPos.x - ((sorted.length - 1) * gap) / 2;
            sorted.forEach((child: any, idx: number) => {
              child.position({
                x: startX + idx * gap,
                y: newParentPos.y,
              });
            });
          }

          this.dragStartParentPos = { ...newParentPos };
          this.dragStartChildPos = { ...node.position() };
        }
      }
    });

    this.cy.on('free', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      if (this.draggedParentNode && (node as any).isChild && (node as any).isChild()) {
        const parentNode = (node as any).parent();
        if (parentNode && parentNode.id() === this.draggedParentNode.id()) {
          arrangeCompoundNodePositions(this.cy!, LAYOUT_CONFIG.coupleGap);
        }
      }

      this.draggedParentNode = null;
      this.dragStartParentPos = null;
      this.dragStartChildPos = null;
    });

    this.cy.on('pan zoom', () => {
      this.updateGenerationLabelsPosition(this.cy!);
    });

    window.removeEventListener('resize', this.updateOnResize);
    window.addEventListener('resize', this.updateOnResize);
  }

  private updateOnResize = () => {
    if (this.cy) {
      this.updateGenerationLabelsPosition(this.cy);
    }
  };

  private setupEventListeners() {
    const addRelationBtn = document.querySelector('.add-relation-btn');
    if (addRelationBtn) {
      addRelationBtn.addEventListener('click', () => {
        this.addRelation();
      });
    }

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (this.cy) {
          const node = this.cy.$(':selected');
          if (node && node.length > 0) {
            const nodeData = node.data();
            if (nodeData && nodeData.name) {
              const userWrap = document.querySelector('.user-wrap');
              if (userWrap) {
                userWrap.classList.remove('add-relation');
              }
              this.handleSelected(nodeData);
            }
          }
        }
      });
    }

    const genderInputs = document.querySelectorAll('input[name="gender"]');
    genderInputs.forEach((input) => {
      input.addEventListener('change', (e) => {
        const target = e.target as HTMLElement;
        genderInputs.forEach((inp) => {
          const label = inp.closest('label.btn');
          if (label) {
            label.classList.remove('active');
          }
        });
        const label = target.closest('label.btn');
        if (label) {
          label.classList.add('active');
        }
      });
    });
  }

  handleSelected(data: any) {
    if (!data) return;
    this.setUserInfo(data);
  }

  setUserInfo(data: any) {
    if (!data) {
      data = {};
    }
    const {
      name = '',
      gender = '',
      birthDate = '',
      isLiving = true,
      deathDate = '',
      birthAddress = '',
      livingAddress = '',
      families = [],
    } = data;

    const fnameInput = document.getElementById('fname') as HTMLInputElement;
    const nameElement = document.querySelector('.name');
    const lifespaElement = document.querySelector('.lifespa');
    const birthdateInput = document.getElementById('birthdate') as HTMLInputElement;
    const birthAddressInput = document.getElementById('birthAddress') as HTMLInputElement;
    const livingAddressInput = document.getElementById('livingAddress') as HTMLInputElement;
    const avatarImg = document.querySelector('.avatar') as HTMLImageElement;

    if (fnameInput) fnameInput.value = name || '';
    if (nameElement) nameElement.textContent = name || '';
    if (lifespaElement) lifespaElement.textContent = isLiving ? '在世' : '过世';

    const _g = ['男', '女'].includes(gender) ? gender : '未知';

    const genderInputs = document.querySelectorAll('input[name="gender"]') as NodeListOf<HTMLInputElement>;
    genderInputs.forEach((input) => {
      const label = input.closest('label.btn');
      if (label) {
        label.classList.remove('active');
      }
      input.checked = false;
    });

    const selectedGender = Array.from(genderInputs).find((input) => input.value === _g);
    if (selectedGender) {
      selectedGender.checked = true;
      const label = selectedGender.closest('label.btn');
      if (label) {
        label.classList.add('active');
      }
    }

    if (birthdateInput) birthdateInput.value = birthDate;
    if (birthAddressInput) birthAddressInput.value = birthAddress;
    if (livingAddressInput) livingAddressInput.value = livingAddress;

    const _portraitUrl = _g === '女' ? 'assets/female.png' : 'assets/male.png';

    if (avatarImg) {
      avatarImg.src = _portraitUrl;
    }

    console.log(name, deathDate, families?.length || 0);
  }

  addRelation() {
    this.stepName = 'add';
    const userWrap = document.querySelector('.user-wrap');
    if (userWrap) {
      userWrap.classList.add('add-relation');
    }
    this.setUserInfo({});
  }

  private renderGenerationLabels(cy: Core) {
    const labelsContainer = document.getElementById('generation-labels');
    if (!labelsContainer) return;

    labelsContainer.innerHTML = '';

    const generationMap = new Map<number, any[]>();
    cy.nodes(':not(:parent)').forEach((node: any) => {
      const generation = node.data('generation');
      if (generation !== undefined && generation !== null) {
        if (!generationMap.has(generation)) {
          generationMap.set(generation, [node]);
        } else {
          generationMap.get(generation)!.push(node);
        }
      }
    });

    const sortedGenerations = Array.from(generationMap.entries()).sort((a, b) => a[0] - b[0]);

    sortedGenerations.forEach(([generation, nodes]) => {
      const label = document.createElement('div');
      label.className = 'generation-label';
      label.textContent = `${generation}`;
      (label as any).dataset.generation = generation;
      (label as any).referenceNodes = nodes;
      labelsContainer.appendChild(label);
    });

    this.updateGenerationLabelsPosition(cy);
  }

  private updateGenerationLabelsPosition(cy: Core) {
    const labels = document.querySelectorAll('#generation-labels .generation-label');
    if (!cy.container()) return;

    labels.forEach((label) => {
      const referenceNodes = (label as any).referenceNodes;
      if (referenceNodes && referenceNodes.length > 0) {
        let totalY = 0;
        let count = 0;

        referenceNodes.forEach((node: any) => {
          if (node && node.length > 0) {
            const bbox = node.renderedBoundingBox();
            if (bbox && bbox.y1 !== undefined && bbox.y2 !== undefined) {
              const centerY = (bbox.y1 + bbox.y2) / 2;
              totalY += centerY;
              count++;
            }
          }
        });

        if (count > 0) {
          const averageY = totalY / count;
          (label as HTMLElement).style.top = `${averageY}px`;
        }
      }
    });
  }

  private genderWeight(gender: string): number {
    if (!gender) return 2;
    if (gender === '男' || gender === 'male' || gender === 'M') return 0;
    if (gender === '女' || gender === 'female' || gender === 'F') return 1;
    return 2;
  }
}
