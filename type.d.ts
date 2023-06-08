//////////
// Util //
//////////

type Either<A, B> = { left: A } | { right: B };
type Maybe<A> = null | { just: A };
type Pair<A, B> = [A, B];
type json = null | boolean | number | string | json[] | { [key: string]: json };

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
type DeepHash = string;
type Report = string;

type DigestPlugin = (specifier: Specifier) => Promise<Hash>;
type ExtractPlugin = (specifier: Specifier) => Promise<Set<Target>>;
type ResolvePlugin = (
  target: Target,
  origin: Specifier
) => Promise<Set<Specifier>>;
type LintPlugin = (specifier: Specifier) => Promise<null | Report>;
type TestPlugin = (specifier: Specifier) => Promise<null | Report>;

type Plugin = {
  digest: DigestPlugin;
  lint: LintPlugin;
  extract: ExtractPlugin;
  resolve: ResolvePlugin;
  test: TestPlugin;
};

type Action =
  | { type: "link"; specifier: Specifier }
  | {
      type: "test";
      specifier: Specifier;
      hash: Hash;
      deep: DeepHash;
    };

type Result =
  | { type: "success"; stage: "link"; hash: Hash; dependencies: Set<Specifier> }
  | { type: "errored"; stage: "link"; error: Error }
  | { type: "success"; stage: "test" }
  | { type: "errored"; stage: "test"; error: Error }
  | { type: "failure"; stage: "test"; report: Report };

type Outcome = { specifier: Specifier; result: Result };

type Stage = "link" | "test";

type Status =
  | { type: "todo" }
  | { type: "pending"; stage: Stage }
  | { type: "done"; skipped: boolean }
  | Result;

type Node = {
  status: Status;
  hash: Maybe<Hash>;
  dependencies: Set<Specifier>;
};

type Graph = Map<Specifier, Node>;

type ExtractCache = MutMap<Hash, Promise<Either<Error, Set<Target>>>>;
type LintCache = MutMap<Hash, Promise<Either<Error, Maybe<Report>>>>;
type TestCache = MutMap<DeepHash, Promise<Either<Error, Maybe<Report>>>>;

type Cache = {
  extract: ExtractCache;
  lint: LintCache;
  test: TestCache;
};
