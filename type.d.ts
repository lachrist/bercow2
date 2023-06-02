/////////////
// Prelude //
/////////////

type Nil = null;
type Cons<A> = { car: A; cdr: List<A> };
type List<A> = Nil | Cons<A>;

type Left<A> = { type: "left"; left: A };
type Right<B> = { type: "right"; right: B };
type Either<A, B> = Left<A> | Right<B>;

type Nothing = null;
type Just<A> = { value: A };
type Maybe<A> = Nothing | Just<A>;

type Pair<A, B> = [A, B];

///////////
// Graph //
///////////

type Index = number;

type Partition<N> = Map<N, Index>;

type Topology = Map<Index, Index[]>;

type ComponentGraph<N> = {
  counter: Index;
  partition: Partition<N>;
  topology: Topology;
};

////////////
// Domain //
////////////

type Specifier = string;
type Target = string;
type Hash = string;
type Message = string;

type DigestResult = Either<Message, Hash>;
type Digest = (specifier: Specifier) => Promise<DigestResult>;

type LinkResult = Either<Message, Specifier[]>;
type Link = (specifier: Specifier) => Promise<LinkResult>;

type ValidateResult = Either<Message, null>;
type Validate = (specifier: Specifier) => Promise<ValidateResult>;

type Plugin = { link: Link; digest: Digest; validate: Validate };

type Stage = "digest" | "link" | "validate";

type DigestAction = {type: "digest", specifier: Specifier};
type LinkAction = {type: "link", specifier: Specifier};
type ValidateAction = {type: "validate", specifiers: Specifier[]};

type Action = DigestAction | LinkAction | ValidateAction;

type Result =
  | { stage: "digest", inner: DigestResult }
  | { stage: "link", inner: LinkResult }
  | { stage: "validate", inner: ValidateResult };

type Status =
  | { type: "todo" }
  | { type: "failure", stage: Stage, message: Message }
  | { type: "success", stage: Stage }
  | { type: "pending", stage: Stage }
  | { type: "impact", causes: Specifier[] }
  | { type: "done" };

type Node = {
  status: Status,
  specifier: Specifier;
  hash: Maybe<Hash>;
  dependencies: Maybe<Specifier[]>;
};

// type Node =
//   | { status: { type: "todo" }, specifier: Specifier, hash: Nothing, dependencies: Nothing }
//   | { status: { type: "pending", stage: "digest"}, specifier: Specifier, hash: Nothing, dependencies: Nothing }
//   | { status: { type: "failure", stage: "digest", message: Message }, specifier: Specifier, hash: Nothing, dependencies: Nothing }
//   | { status: { type: "success", stage: "digest" }, specifier: Specifier, hash: Just<Hash>, dependencies: Nothing }
//   | { status: { type: "pending", stage: "link" }, specifier: Specifier, hash: Just<Hash>, dependencies: Nothing }
//   | { status: { type: "failure", stage: "link", message: Message }, specifier: Specifier, hash: Just<Hash>, dependencies: Nothing }
//   | { status: { type: "success", stage: "link" }, specifier: Specifier, hash: Just<Hash>, dependencies: Just<Set<Specifier>> }
//   | { status: { type: "pending", stage: "validate" }, specifier: Specifier, hash: Just<Hash>, dependencies: Just<Set<Specifier>> }
//   | { status: { type: "failure", stage: "validate", message: Message }, specifier: Specifier, hash: Just<Hash>, dependencies: Just<Set<Specifier>> }
//   | { status: { type: "success", stage: "validate" }, specifier: Specifier, hash: Just<Hash>, dependencies: Just<Set<Specifier>> }
//   | { status: { type: "impact", stage: "validate", causes: Specifier[] }, specifier: Specifier, hash: Just<Hash>, dependencies: Just<Set<Specifier>> }
//   | { status: { type: "done" }, specifier: Specifier, hash: Just<Hash>, dependencies: Just<Set<Specifier>> };

type State = {nodes: Node[], graph: ComponentGraph<Specifier>}

type Cache = Map<Specifier, Node>;

type step = (
  current: State,
  specifier: Specifier,
  result: Result,
) => Either<Message, { next: State; actions: Action[] }>;

// type Node =
//   | { type: "todo" }
//   | { type: "digest-pending" }
//   | { type: "digest-failure", message: Message }
//   | { type: "digest-success", hash: Hash }
//   | { type: "link-pending", hash: Hash }
//   | { type: "link-failure", hash: Hash, message: Message }
//   | { type: "link-success", hash: Hash, dependencies: Set<Specifier> }
//   | { type: "validate-pending", hash: Hash, dependencies: Set<Specifier> }
//   | { type: "validate-failure", hash: Hash, dependencies: Set<Specifier>, message: Message }
//   | { type: "validate-success", hash: Hash, dependencies: Set<Specifier> }
//   | { type: "done", hash: Hash, dependencies: Set<Specifier> };

// type State = Map<Specifier, Node>;

// type Status =
//   | { type: "todo" }
//   | { type: "digest-pending" }
//   | { type: "digest-failure", message: Message }
//   | { type: "digest-success", hash: Hash }
//   | { type: "link-pending", hash: Hash }
//   | { type: "link-failure", hash: Hash, message: Message }
//   | { type: "link-success", hash: Hash }
//   | { type: "validate-pending", hash: Hash }
//   | { type: "validate-failure", hash: Hash, message: Message }
//   | { type: "validate-success", hash: Hash }
//   // | { type: "validate-impact", hash: Hash, cause: Specifier }
//   | { type: "done", hash: Hash };

// type State = Graph<Specifier, Status>;

// type init = (roots: Set<Specifier>) => ({ next: State, actions: Action[] });
