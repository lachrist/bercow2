/////////////
// Prelude //
/////////////

type json = null | boolean | number | string | json[] | { [key: string]: json };

type Nil = null;
type Cons<A> = { car: A; cdr: List<A> };
type List<A> = Nil | Cons<A>;

type Left<A> = { left: A };
type Right<B> = { right: B };
type Either<A, B> = Left<A> | Right<B>;

type Nothing = null;
type Just<A> = { just: A };
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
// Impure //
////////////

type Stream<X> = {
  pendings: ((maybe: Maybe<X>) => void)[];
  queue: X[];
  done: boolean;
};

type State<X> = { value: X };

type MutMap<K, V> = { map: Map<K, V> };

////////////
// Domain //
////////////

type Specifier = string;
type Target = string;
type Hash = string;
type ShallowHash = string;
type DeepHash = string;

type DigestPlugin = (specifier: Specifier) => Promise<Hash>;
type LintPlugin = (specifier: Specifier) => Promise<void>;
type ExtractPlugin = (specifier: Specifier) => Promise<Set<Target>>;
type ResolvePlugin = (
  target: Target,
  origin: Specifier
) => Promise<Set<Specifier>>;
type TestPlugin = (specifier: Specifier) => Promise<void>;

type Plugin = {
  digest: DigestPlugin;
  lint: LintPlugin;
  extract: ExtractPlugin;
  resolve: ResolvePlugin;
  test: TestPlugin;
};

type LintResult = Either<Error, ShallowHash>;
type Lint = (specifier: Specifier) => Promise<LintResult>;

type LinkResult = Either<Error, Set<Specifier>>;
type Link = (specifier: Specifier, hash: ShallowHash) => Promise<LinkResult>;

type TestResult = Maybe<Error>;
type Test = (specifier: Specifier, hash: DeepHash) => Promise<TestResult>;

type LintAction = { type: "lint"; specifier: Specifier };
type LinkAction = { type: "link"; specifier: Specifier; hash: ShallowHash };
type TestAction = { type: "test"; specifier: Specifier; hash: DeepHash };

type Action = LintAction | LinkAction | TestAction;

type Result =
  | { type: "lint"; inner: LintResult }
  | { type: "link"; inner: LinkResult }
  | { type: "test"; inner: TestResult };

type Outcome = { specifier: Specifier; result: Result };

type Stage = "lint" | "link" | "test";

type Status =
  | { type: "todo" }
  | { type: "pending"; stage: Stage }
  | { type: "failure"; stage: Stage; error: Error }
  | { type: "success"; stage: Stage }
  | { type: "done"; skipped: boolean };

type Node = {
  status: Status;
  hash: Maybe<Hash>;
  dependencies: Set<Specifier>;
};

type Graph = Map<Specifier, Node>;
