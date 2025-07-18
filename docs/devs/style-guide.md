# METIS: Style Guide

## Table of Contents:

- [**Docstrings**](#docstrings)
  - [Overview](#overview)
  - [Functions and Methods](#functions-and-methods)
  - [Classes and Interfaces](#classes-and-interfaces)
  - [String Literals](#string-literals)
  - [General Types, Enumerations, Variables, and Properties of Classes, Types and Interfaces](#general-types-enumerations-variables-and-properties-of-classes-types-and-interfaces)
  - [Notes](#notes)
  - [Defaults](#defaults)
  - [Deprecated Code](#deprecated-code)
  - [Examples](#examples)
  - [Code References](#code-references)
  - [Inherited Docs](#inherited-docs)
- [**Naming Conventions**](#naming-conventions)
  - [Overview](#overview-1)
  - [Types](#types)
  - [Interfaces](#interfaces)
  - [Class Properties](#class-properties)
  - [AJAX Functions and Methods](#ajax-functions-and-methods)
  - [Constants](#constants)
- [**Organization**](#organization)
  - [Order Within Files](#order-within-files)
  - [Class Properties](#class-properties-1)
- [**Comments**](#comments)
  - [Todos](#todos)

## Docstrings

### Overview

Docstrings should be included for the following:

- Any exported member of a file.
- All types, classes, interfaces, functions, and enumerations.
- Class properties, interface properties, type properties, methods, and constructors with parameters. Any implemented or overridden property, method, or constructor of a class does not require a docstring if the docstring of the parent accurately describes it.

Docstrings are not required on the following:

- Any local variable of a function or method.
- Any non-exported, less-significant variable within a file that is solely used in a logical operation or calculation and is not pertinent apart from that operation or calculation.

### Functions and Methods

Functions and methods should include an unmarked description at the top describing what the function or method does. Below the description, the parameters, if any, should be enumerated in the order they are defined in the function or method. Each parameter description should be started with the `@param` tag, followed by the name of the parameter, followed by its description. If the function or method does not have a return type of void, the return type should be described next. The return description should be started with the `@returns` tag, followed by the description of what’s returned.

```tsx
/**
 * Generate an action outcome based on the factors passed.
 * @param action The action producing an outcome.
 * @param rng The random number generator used to determine success.
 * @returns The predetermined outcome of the action.
 */
public static generateOutcome(
  action: ServerMissionAction,
  rng: PRNG,
): ServerActionOutcome {
  return new ServerActionOutcome(action, rng())
}
```

If the `@return` tag description and the primary description for a function or method is essentially the same, only the `@return` tag description is required.

```jsx
/**
 * @returns Whether the user will be logged out within three seconds from now.
 */
vergingSessionExpiration(): boolean
```

If the function above did have a description above the `@return` tag it would say the same thing as the `@return` tag. Therefore, it is omitted.

If there is a possibility of a function throwing an error, this should also be documented using the `@throws` tag, followed by a description of when the function or method throws an error.

```jsx
/**
 * The course to which that the mission belongs.
 * @throws If course data has not been populated. Check the "courseAjaxStatus" property before calling this.
 */
public get course(): Course {
	if (!(this._course instanceof Course)) {
    throw Error('Course data for this mission has not been populated.')
  }
  return this._course
}
```

If a function returns a promise, then special syntax should be used within the docstring to describe what the promise resolves and rejects to. The `@resolves` tag and the `@rejects` tag should be used anywhere where a function or method returns a promise, followed by a brief description of what resolves and rejects.

```tsx
/**
 * Copies the mission into a new template.
 * @resolves with the resulting template ID.
 * @rejects If the request fails.
 */
public $copy(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    let sourceMissionId = this.id

    axios
      .post(join(API_ROOT_PATH, 'copy'), {
        sourceMissionId,
      })
      .then((response: AxiosResponse<{ templateId: number }>) => {
        resolve(response.data.templateId)
      })
      .catch((error) => {
        error.message = 'Failed to copy mission via API.'
        console.error(error)
        reject(error)
      })
  })
}
```

### Classes and Interfaces

Classes should include a docstring that describes the purpose of the class. If a class or interface extends another class or interface, or a class implements an interface, the `@extends` or `@implements` tag should be included followed by the name of the parent in curly braces.

```tsx
/**
 * An outcome for the execution of an action via the ServerMission.execute method.
 * @implements {IActionOutcome}
 */
export class ServerActionOutcome implements IActionOutcome {}
```

### String Literals

String literals should include a docstring that describes the purpose of the literal. The `@option` tag should be included once for each option in the string literal, with a brief description of what that option is for.

```tsx
/**
 * Method for handling errors via the `Provider.handleError` method.
 * @option 'Bubble' A notification bubble will be displayed to the user.
 * @option 'FullScreen' A full-screen error message will be displayed to the user, similar to how the loading screen is rendered.
 */
export type THandleErrorMethod = 'Bubble' | 'FullScreen'
```

### General types, Enumerations, Variables, and Properties of Classes, Types and Interfaces

For anything else requiring a docstring, a simple description should be included.

```tsx
/**
 * The strength of the action in succeeding. This is a number between 0 and 1. If the number is greater than the action's chance of failure, the action is successful.
 */
private successStrength: number
```

### Notes

To add additional information to a docstring, aside from its description, an optional `@note` tag can be appended after the description.

```tsx
/**
 * Options for the ClientMissionNode.open method.
 */
export interface INodeClientOpenOptions extends INodeOpenOptions {
  /**
   * The child node data with which to populate the now open node.
   * @note Fails if the node already has children.
   * @default undefined
   */
  revealedChildNodes?: Array<TMissionNodeJSON>
}
```

### Defaults

If a parameter of a function, method, or constructor is optional, the default value should be documented with the `@default` tag followed by the default value as it would be written in TypeScript.

```tsx
/**
 * Options for creating the METIS server.
 */
export interface IMetisServerOptions {
  /**
   * The port on which to run the server.
   * @default 8080
   */
  port?: number
  /**
   * The name of the MongoDB database to use.
   * @default "metis"
   */
  mongoDB?: string
  /**
   * The host of the MongoDB database to use.
   * @default "localhost"
   */
  mongoHost?: string
  /**
   * The port of the MongoDB database to use.
   * @default 27017
   */
  mongoPort?: number
  /**
   * The username of the MongoDB database to use. Defaults to undefined.
   * @default undefined
   */
  mongoUsername?: string
  /**
   * The password of the MongoDB database to use.
   * @default undefined
   */
  mongoPassword?: string
}
```

### Deprecated Code

Whenever a piece of code because deprecated in favor of something new, the `@deprecated` can be used to indicate the deprecation. VSCode will even strike-through any reference to the deprecated code to indicate to any developers its fleeting support.

```jsx
/**
 * @deprecated use TAjaxStatus instead.
 */
export enum EAjaxStatus {
  NotLoaded = 'NotLoaded',
  Loading = 'Loading',
  Loaded = 'Loaded',
  Failed = 'Failed',
}

/**
 * The status of an AJAX request.
 */
export type TAjaxStatus = 'NotLoaded' | 'Loading' | 'Loaded' | 'Failed'
```

```jsx
// ! Note the strike-through in the EAjaxStatus reference.
interface IProps {
  status: ~~EAjaxStatus~~ | TAjaxStatus
  pendingMessage: string
  style: React.CSSProperties
  inline: boolean
}
```

### Examples

Examples are optional, however, if a description simply doesn’t explain the purpose well enough, an example may be needed. An example can be created with the `@example` tag followed by a Markdown code block with the code in use.

````tsx
/**
 * Takes in a components props and an object defining default props. If any property of default props is undefined for the corresponding value in props, the default value will be assigned in props.
 * @param props The props to assign default values to.
 * @param defaultProps The default values to assign to props.
 * @example
 * ```
 * // This component will have a default
 * // text of 'Click me!' if no text is
 * // provided.
 * function Button(props: { text?: string; handleClick: () => void }) {
 *   useDefaultProps(props, { text: 'Click me!' })
 *
 *   let { text, handleClick } = props
 *
 *   return <div onClick={handleClick}>{text}</div>
 * }
 *
 * function Panel(props: {}) {
 *   return <div>
 *     <Button handleClick={submit} />
 *   </div>
 * }
 * ```
 */
export function useDefaultProps<
  TProps extends {},
  TDefaultProps extends Partial<TProps>,
  TReturnedProps extends Omit<TProps, keyof TDefaultProps> & TDefaultProps,
>(props: TProps, defaultProps: TDefaultProps): TReturnedProps {
  let returnedProps: any = {
    ...defaultProps,
    ...props,
  }
  return returnedProps
````

### Code References

If a docstring includes a direct reference to another piece of code, this reference can be wrapped in ```` so that the reference is highlighted in VSCode. This is done to highlight the relationship of code throughout the application.

```jsx
/**
 * The instructor that is in charge of this course.
 * @note This will be a `User` object if the instructor has been loaded, or it
 * will be a string (user ID) if the instructor has not been loaded
 */
protected _instructor: User | string
```

User is wrapped in ```` because the comment is reference the User class explicitly.

### Inherited Docs

The tag `@inheritdoc` can be added to a docstring in order to reference another docstring. This will be used whenever a referenced docstring directly applies to the docstring that references it.

```tsx
/**
 * @inheritdoc TSendOutput
 */
const sendOutput: TSendOutput = (message, options) => {
  // Function implementation here...
}

/**
 * Sends the message to the output panel within a session.
 * @param message The output's message.
 * @param options Additional options for sending the output.
 * @note By default, this will send output to the force to which
 * the effect belongs, unless configured otherwise.
 */
type TSendOutput = (
  message: string,
  options: TManipulateForceOptions = {},
) => void
```

In this example, the `sendOutput` function has the same docstring as the `TSendOutput` type. Therefore, a direct reference is made to the `TSendOutput` docstring in the `sendOutput` docstring.

## Naming Conventions

### Overview

When naming any piece of code, whether a variable, a class, or anything else, the name of the piece of code shouldn't appear ambiguous, rather, it should imply the purpose of the piece of code. Using similar terms for two unrelated components is discouraged also, as clear misunderstandings could happen.

For example, the Button component used to be called Action. However, this was changed because nodes contain actions that can be executed on a node. These are two very different things with the same term being used. If these concepts are used together, the code can quickly become difficult to understand. Therefore, the actions were renamed to buttons.

Names given should also avoid non-conventional abbreviations. Terms that are commonly understood, such as “env”, “doc”, and “ref” are permitted. However, over-abbreviating can quickly make the code difficult to read.

Names given should also not be overly long. Names should be limited to 3-4 words max, if possible. If a name is too long, and a suitable term cannot be given to shorten it, abbreviations are, in this case, encouraged, to shorten the variable, so long as the term used is easy to understand.

### Types

Types should be prefixed with the letter "T” when assigned a name:

```tsx
type TMissionImportResult = // Type definition here...
```

If a string literal type is needed, the strings should be written in kebab case, unless its use case requires another format.

```tsx
/**
 * The status of an AJAX request.
 */
export type TAjaxStatus = 'not-loaded' | 'loading' | 'loaded' | 'failed'
```

### Interfaces

Interfaces are discouraged in favor of regular types. However, if an interface is needed, the interface should be prefixed with the letter I.

```tsx
interface IMissionImportResult {
  // Interface definition here...
}
```

### Class Properties

If a class property contains a corresponding getter and/or setter, the class property should be grouped with the getter and/or setter to keep the entire definition of the property together in one place.

```tsx
// Implemented
public actions: Map<string, TMissionAction>

/**
 * The current execution in process on the node by an action.
 */
protected _execution: TActionExecution | null
// Implemented
public get execution(): TActionExecution | null {
  return this._execution
}

/**
 * The outcomes of the actions that are performed on the node.
 */
protected _outcomes: Array<TActionOutcome>
// Inherited
public get outcomes(): Array<TActionOutcome> {
  return [...this._outcomes]
}

// Implemented
public parentNode: TRelativeNode | null
```

### AJAX Functions and Methods

Many functions and methods in the application are responsible for making AJAX requests to the METIS API to perform certain actions or fetch specific data. Whenever a function makes an AJAX call and that function returns a promise that resolves when the request is fulfilled, that function should be prefixed with `$` to denote its AJAX behavior. This is needed because some methods may be named similarly such as `update`, which could perform an update on the client or the server. Prefixing this method with the `$` symbol shows that the method performs a server update, while the method without the `$` performs a client update.

```jsx
/**
 * Fetches all courses available to the current session.
 * @return A promise that resolves to the fetched courses.
 */
public static $fetch(): Promise<Course[]> {
  return new Promise<Course[]>(async (resolve, reject) => {
    try {
      // Make request.
      let { data } = await axios.get<{ courses: TCourseJson[] }>(API_ENDPOINT)
      // Resolve creating new Course objects
      // from the JSON returned.
      resolve(Course.createMany(data.courses, { posted: true }))
    } catch (error) {
      console.error('Failed to fetch available courses.')
      console.error(error)
      reject(error)
    }
  })
}
```

### Constants

Globally accessible constants, as well as static, read-only class fields, should be assigned a name in all-caps and in snake case.

```tsx
// A globally-accessible constant in all-caps and in snake case.
const MIN_COUNT = 10

// A class with a static, read-only field in all-caps and in snake case.
class MyClass {
  public static readonly MAX_COUNT = 30
}
```

## Organization

### Order Within Files

Files should list classes, constants, functions, etc… first, with all types enumerated at the bottom.

### Class Properties

Related class properties are grouped together in a class for ease-of-access. No space is given between the related properties, while space is given between the groups themselves. This is done to make the groups stand out.

```jsx
// ! Note the space between the ajax status properties and the ID property.

/**
 * The status on whether the instructor of this course has been loaded.
 */
protected _instructorAjaxStatus: TAjaxStatus
/**
 * The status on whether the instructor of this course has been loaded.
 */
public get instructorAjaxStatus(): TAjaxStatus {
  return this._instructorAjaxStatus
}

/**
 * The ID of the instructor that is in charge of this course.
 */
public get instructorID(): string {
  let instructor: User | string = this._instructor

  // Return the instructorID based on
  // whether the instructor data has
  // been populated yet.
  if (instructor instanceof User) {
    return instructor.userID
  } else {
    return instructor
  }
}
```

A class should be organized in the following order:

1. Non-static properties
2. Constructor
3. Non-static methods
4. Static properties
5. Static methods

```tsx
/**
 * Some example class.
 */
export default class SomeClass {
  /**
   * First value.
   */
  public value1

  /**
   * Second value.
   */
  public value2

  public constructor() {
    this.value1 = SomeClass.VALUE_1_DEFAULT
    this.value2 = SomeClass.VALUE_2_DEFAULT
  }

  /**
   * Determines the sum of `value1` and `value2`.
   */
  public determineSum(): number {
    return value1 + value2
  }

  /**
   * Default value for `value1`.
   */
  public static readonly VALUE_1_DEFAULT = 1

  /**
   * Default value for `value2`.
   */
  public static readonly VALUE_2_DEFAULT = 1

  /**
   * Creates new `SomeClass` with the values double their default.
   */
  public static constructDouble(): SomeClass {
    let someClass = new SomeClass()

    someClass.value1 *= 2
    someClass.value2 *= 2

    return someClass
  }
}
```

## Comments

### Todos

Todo comments may be found throughout the project to denote work that needs to be done. This can be achieved with the `// todo:` syntax.

```jsx
/**
 * Creates `Objective` objects from an array of objective data.
 * @param data - The array of objective data.
 * @return The `Objective` objects created.
 */
public static createMany(
  data: IObjectiveJson[],
  // options: TObjectiveOptions = {},
  options: { posted?: boolean } = {},
): Objective[] {
  // todo: Write logic for creating multiple objectives.
  console.warn(
    '`Objective.createMany` was called but the logic for it has not been written yet.',
  )
  return []
}
```
