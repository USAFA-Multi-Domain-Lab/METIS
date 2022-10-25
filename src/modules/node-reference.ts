import { MissionNode } from './missions'
import { AnyObject } from './toolbox/objects'

// This is an enum used by the
// NodeStructureReference move
// function to describe the
// purpose of the target
// property past.
export enum ENodeTargetRelation {
  Parent,
  PreviousSibling,
  FollowingSibling,
}

// This is a reference to a node
// used in the NodeStructuring
// component to expand and collapse
// the structure.
export default class NodeStructureReference {
  nodeID: string
  parentNode: NodeStructureReference | null
  subnodes: Array<NodeStructureReference>
  displayName: string
  _isExpanded: boolean

  get siblings(): Array<NodeStructureReference> {
    let siblings: Array<NodeStructureReference> = []

    if (this.parentNode !== null) {
      let childrenOfParent: Array<NodeStructureReference> =
        this.parentNode.subnodes

      siblings = childrenOfParent.filter(
        (childOfParent: NodeStructureReference) =>
          childOfParent.nodeID !== this.nodeID,
      )
    }

    return siblings
  }

  get childrenOfParent(): Array<NodeStructureReference> {
    let childrenOfParent: Array<NodeStructureReference> = []

    if (this.parentNode !== null) {
      childrenOfParent = this.parentNode.subnodes
    }

    return childrenOfParent
  }

  get previousSibling(): NodeStructureReference | null {
    let previousSibling: NodeStructureReference | null = null

    if (this.parentNode !== null) {
      let childrenOfParent: Array<NodeStructureReference> =
        this.parentNode.subnodes

      childrenOfParent.forEach(
        (childOfParent: NodeStructureReference, index: number) => {
          if (childOfParent.nodeID === this.nodeID && index > 0) {
            previousSibling = childrenOfParent[index - 1]
          }
        },
      )
    }

    return previousSibling
  }

  get followingSibling(): NodeStructureReference | null {
    let followingSibling: NodeStructureReference | null = null

    if (this.parentNode !== null) {
      let childrenOfParent: Array<NodeStructureReference> =
        this.parentNode.subnodes

      childrenOfParent.forEach(
        (childOfParent: NodeStructureReference, index: number) => {
          if (
            childOfParent.nodeID === this.nodeID &&
            index + 1 < childrenOfParent.length
          ) {
            followingSibling = childrenOfParent[index + 1]
          }
        },
      )
    }

    return followingSibling
  }

  get isExpanded(): boolean {
    return this._isExpanded
  }

  get isCollapsed(): boolean {
    return !this._isExpanded
  }

  get expandable(): boolean {
    return this.subnodes.length > 0
  }

  constructor(
    nodeID: string,
    parentNode: NodeStructureReference | null,
    subnodes: Array<NodeStructureReference>,
    displayName: string = nodeID,
  ) {
    this.nodeID = nodeID
    this.parentNode = parentNode
    this.subnodes = subnodes
    this.displayName = displayName
    this._isExpanded = false
  }

  // This will mark this reference
  // as expanded if possible.
  expand(): void {
    if (this.expandable) {
      this._isExpanded = true
    } else {
      throw new Error(`Cannot expand ${this.nodeID} as it has no subnodes:`)
    }
  }

  // This will mark this reference
  // as collapsed if possible.
  collapse(): void {
    if (this.expandable) {
      this._isExpanded = false
    } else {
      throw new Error(`Cannot collapse ${this.nodeID} as it has no subnodes:`)
    }
  }

  // This will toggle between expanded
  // and collapse if possible.
  toggle(): void {
    if (this.isExpanded) {
      this.collapse()
    } else {
      this.expand()
    }
  }

  // This will move this reference to
  // a new location relative to the target
  // and relation this target has to the
  // destination.
  move(
    target: NodeStructureReference,
    targetRelation: ENodeTargetRelation,
  ): void {
    let parentNode: NodeStructureReference | null = this.parentNode
    let newParentNode: NodeStructureReference | null = target.parentNode
    let newParentNodeSubnodes: Array<NodeStructureReference> = []

    if (parentNode !== null) {
      let siblings: NodeStructureReference[] = parentNode.subnodes

      for (let index: number = 0; index < siblings.length; index++) {
        let sibling = siblings[index]

        if (this.nodeID === sibling.nodeID) {
          siblings.splice(index, 1)
        }
      }
    }

    switch (targetRelation) {
      case ENodeTargetRelation.Parent:
        target.subnodes.push(this)
        this.parentNode = target
        break
      case ENodeTargetRelation.PreviousSibling:
        if (newParentNode !== null) {
          newParentNode.subnodes.forEach((subnode: NodeStructureReference) => {
            newParentNodeSubnodes.push(subnode)

            if (subnode.nodeID === target.nodeID) {
              newParentNodeSubnodes.push(this)
              this.parentNode = newParentNode
            }
          })

          newParentNode.subnodes = newParentNodeSubnodes
        }
        break
      case ENodeTargetRelation.FollowingSibling:
        if (newParentNode !== null) {
          newParentNode.subnodes.forEach((subnode: NodeStructureReference) => {
            if (subnode.nodeID === target.nodeID) {
              newParentNodeSubnodes.push(this)
              this.parentNode = newParentNode
            }

            newParentNodeSubnodes.push(subnode)
          })

          newParentNode.subnodes = newParentNodeSubnodes
        }
        break
    }
  }

  // This will expand all subnodes
  // of this node if possible.
  expandSubnodes(): void {
    for (let subnode of this.subnodes) {
      if (subnode.expandable) {
        subnode.expand()
      }
    }
  }

  // This will convert this NodeStructureReference
  // back into regular mission nodeStructure
  // data.
  deconstructNodeStructureReference(): AnyObject {
    return NodeStructureReference.deconstructNodeStructureReference(this, {})
  }

  // This will convert mission
  // nodeStructure data into a
  // NodeStructureReference.
  static constructNodeStructureReference(
    nodeID: string,
    nodeStructure: AnyObject,
    nodeData: Map<string, MissionNode>,
    expandAll: boolean = false,
  ): NodeStructureReference {
    let subnodes: Array<NodeStructureReference> = []
    let subnodeKeyValuePairs: Array<[string, AnyObject | string]> = Object.keys(
      nodeStructure,
    ).map((key: string) => [key, nodeStructure[key]])
    let node: MissionNode | undefined = nodeData.get(nodeID)
    let displayName: string = node === undefined ? nodeID : node.name

    for (let subnodeKeyValuePair of subnodeKeyValuePairs) {
      let key: string = subnodeKeyValuePair[0]
      let value: AnyObject | string = subnodeKeyValuePair[1]

      if (typeof value !== 'string') {
        subnodes.push(
          NodeStructureReference.constructNodeStructureReference(
            key,
            value,
            nodeData,
            expandAll,
          ),
        )
      }
    }

    let nodeStructureReference: NodeStructureReference =
      new NodeStructureReference(nodeID, null, subnodes, displayName)

    if (expandAll && nodeStructureReference.expandable) {
      nodeStructureReference.expand()
    }

    for (let subnode of subnodes) {
      subnode.parentNode = nodeStructureReference
    }

    return nodeStructureReference
  }

  // This will convert this NodeStructureReference
  // back into regular mission nodeStructure
  // data.
  static deconstructNodeStructureReference(
    nodeStructureReference: NodeStructureReference,
    nodeStructure: AnyObject = {},
  ): AnyObject {
    let subnodes: NodeStructureReference[] = nodeStructureReference.subnodes

    if (subnodes.length > 0) {
      for (let subnodeReference of nodeStructureReference.subnodes) {
        let substructure: AnyObject = {}
        nodeStructure[subnodeReference.nodeID] = substructure
        NodeStructureReference.deconstructNodeStructureReference(
          subnodeReference,
          substructure,
        )
      }
    } else {
      nodeStructure['END'] = 'END'
    }

    return nodeStructure
  }

  // This will dig deep into a given
  // node structure reference and find
  // the given target subnode.
  static findReference = (
    reference: NodeStructureReference,
    target: MissionNode,
  ): NodeStructureReference | undefined => {
    let subnodes = reference.subnodes

    for (let subnode of subnodes) {
      let subnodeResults: NodeStructureReference | undefined =
        NodeStructureReference.findReference(subnode, target)

      if (subnodeResults !== undefined) {
        return subnodeResults
      } else if (subnode.nodeID === target.nodeID) {
        return subnode
      }
    }
  }
}
