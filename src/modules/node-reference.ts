import MissionMap from '../components/content/MissionMap'
import { Mission, MissionNode } from './missions'
import { AnyObject } from './toolbox/objects'

// This is a reference to a node
// used in the NodeStructuring
// component to expand and collapse
// the structure.
export default class NodeStructureReference {
  name: string
  subnodes: Array<NodeStructureReference>
  _isExpanded: boolean

  get isExpanded(): boolean {
    return this._isExpanded
  }

  get expandable(): boolean {
    return this.subnodes.length > 0
  }

  constructor(name: string, subnodes: Array<NodeStructureReference>) {
    this.name = name
    this.subnodes = subnodes
    this._isExpanded = false
  }

  // This will mark this reference
  // as expanded if possible.
  expand(): void {
    if (this.expandable) {
      this._isExpanded = true
    } else {
      throw new Error(`Cannot expand ${this.name} as it has no subnodes:`)
    }
  }

  // This will mark this reference
  // as collapsed if possible.
  collapse(): void {
    if (this.expandable) {
      this._isExpanded = false
    } else {
      throw new Error(`Cannot collapse ${this.name} as it has no subnodes:`)
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

  // This will convert mission
  // nodeStructure data into a
  // NodeStructureReference.
  static constructNodeStructureReference(
    name: string,
    nodeStructure: AnyObject,
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
          NodeStructureReference.constructNodeStructureReference(key, value),
        )
      }
    }

    return new NodeStructureReference(name, subnodes)
  }

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
      } else if (subnode.name === target.name) {
        return subnode
      }
    }
  }

  expandSubnodes(): void {
    for (let subnode of this.subnodes) {
      if (subnode.expandable) {
        subnode.expand()
      }
    }
  }
}
