import { MissionNode } from './missions'
import { AnyObject } from './toolbox/objects'

// This is a reference to a node
// used in the NodeStructuring
// component to expand and collapse
// the structure.
export default class NodeStructureReference {
  nodeID: string
  parentNode: NodeStructureReference | null
  subnodes: Array<NodeStructureReference>
  _isExpanded: boolean

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
  ) {
    this.nodeID = nodeID
    this.parentNode = parentNode
    this.subnodes = subnodes
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
  // a new parent node.
  move(destination: NodeStructureReference): void {
    let parentNode: NodeStructureReference | null = this.parentNode

    if (parentNode !== null) {
      let siblings: NodeStructureReference[] = parentNode.subnodes

      for (let index: number = 0; index < siblings.length; index++) {
        let sibling = siblings[index]

        if (this.nodeID === sibling.nodeID) {
          siblings.splice(index, 1)
        }
      }

      destination.subnodes.push(this)
      this.parentNode = destination
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
    expandAll: boolean = false,
  ): NodeStructureReference {
    let subnodes: Array<NodeStructureReference> = []
    let subnodeKeyValuePairs: Array<[string, AnyObject | string]> = Object.keys(
      nodeStructure,
    ).map((key: string) => [key, nodeStructure[key]])

    for (let subnodeKeyValuePair of subnodeKeyValuePairs) {
      let key: string = subnodeKeyValuePair[0]
      let value: AnyObject | string = subnodeKeyValuePair[1]

      if (typeof value !== 'string') {
        subnodes.push(
          NodeStructureReference.constructNodeStructureReference(
            key,
            value,
            expandAll,
          ),
        )
      }
    }

    let nodeStructureReference: NodeStructureReference =
      new NodeStructureReference(nodeID, null, subnodes)

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
