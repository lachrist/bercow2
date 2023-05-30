
/////////////
// Prelude //
/////////////

type Nil = null;
type Cons<A> = { car: A, cdr: List<A> }
type List<A> = Nil | Cons<A>

type Left<A> = { type: "left", left: A };
type Right<B> = { type: "right", right: B };
type Either<A, B> = Left<A> | Right<B>;

type Nothing = null;
type Just<A> = { value: A };
type Maybe<A> = Nothing | Just<A>;

type Pair<A, B> = [A, B];

type Entry<K, V> = Pair<K, V>
type Dict<K, V> = List<Entry<K, V>>

type Graph<N> = Map<N, Set<N>>;

type LabelGraph<N, L> = {graph: Graph<N>, labels: Map<N, L>};

////////////
// Domain //
////////////

type Specifier = string;
type Target = string;
type Hash = string;
type Message = string;
type Import = {origin: Specifier, target: Target};

type Link = (specifier: Specifier) => Promise<Either<Message, Set<Specifier>>>;
type Digest = (specifier: Specifier) => Promise<Either<Message, Hash>>;
type Validate = (specifier: Specifier) => Promise<Either<Message, null>>;
type Plugin = { link: Link, digest: Digest, validate: Validate };
