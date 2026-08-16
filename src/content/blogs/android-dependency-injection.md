---
title: "Pass collaborators in through a constructor. Reach for a graph only at the Android edge, where the system constructs the screen."
description: "On Android, types you own should take constructors. Activities cannot. A small handwritten graph, Hilt, or Koin all exist to fill that gap — they differ in whether a missing binding fails the build or shows up at runtime."
banner: "/assets/blogs/android-dependency-injection/banner.jpg"
---

## Constructors first

A presenter that news up its repository owns that repository forever. A presenter that receives one can take a fake in a test.

```kotlin
class SessionPresenter(
    private val view: SessionView,
    private val sessions: SessionStore
)
```

A setter is the same idea, later and mutable:

```kotlin
class SessionPresenter {
    lateinit var view: SessionView

    fun attach(view: SessionView) {
        this.view = view
    }
}
```

Prefer the constructor when the type is yours. `Activity`, `Application`, and `Service` are not. The framework allocates them, so there is no constructor to feed. The rest of this post is only about that edge.

## A graph you can read

If the Activity builds `SessionStore` which builds a Retrofit API which builds the presenter, the screen owns the world. Flip it: one place wires the chain, and types only declare what they need.

```kotlin
class SessionStore(private val api: SessionApi)

class SessionPresenter(
    private val view: SessionView,
    private val sessions: SessionStore
)

object SessionGraph {
    fun presenter(view: SessionView): SessionPresenter {
        val api = SessionClient.create()
        return SessionPresenter(view, SessionStore(api))
    }
}

class SessionActivity : AppCompatActivity(), SessionView {
    private lateinit var presenter: SessionPresenter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        presenter = SessionGraph.presenter(this)
    }
}
```

That is inversion of control without a library. Keep lookups out of `SessionStore` and `SessionPresenter`. A `when (T::class)` helper that hands back whatever was asked for is a service locator: every class can pull any other class, and tests stub a global instead of passing a fake store.

## Hilt is the generated version of that graph

Hilt is Dagger with Android entry points already generated. JSR 330 `@Inject` marks a constructor the graph may call. `@Module` / `@Provides` / `@Binds` cover types you cannot construct (a Retrofit interface, an interface bound to the Activity). `@HiltAndroidApp` and `@AndroidEntryPoint` are the container at `Application` and `Activity`.

```kotlin
class SessionStore @Inject constructor(
    private val api: SessionApi
)

class SessionPresenter @Inject constructor(
    private val view: SessionView,
    private val sessions: SessionStore
)

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides
    fun sessionApi(): SessionApi = SessionClient.create()
}

@Module
@InstallIn(ActivityComponent::class)
abstract class SessionBindings {
    @Binds abstract fun sessionView(activity: SessionActivity): SessionView
}

@AndroidEntryPoint
class SessionActivity : AppCompatActivity(), SessionView {
    @Inject lateinit var presenter: SessionPresenter
}
```

The generated component is ordinary Java: factories for `@Provides`, constructors for `@Inject`, a members injector that assigns `activity.presenter`. A missing binding fails the build. There is no reflection on the call path.

`@Singleton` (and Hilt’s `@ActivityRetainedScoped`, `@ViewModelScoped`) is the lifetime of a binding, not a design pattern. One instance while that component lives.

## Koin if you want a DSL instead of codegen

Koin keeps the graph as Kotlin lambdas. `get()` is a lookup. Nothing is generated.

```kotlin
val sessionModule = module {
    single<SessionApi> { SessionClient.create() }
    single { SessionStore(get()) }
    factory { (view: SessionView) -> SessionPresenter(view, get()) }
}

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidContext(this@App)
            modules(sessionModule)
        }
    }
}

class SessionActivity : AppCompatActivity(), SessionView {
    private val presenter: SessionPresenter by inject { parametersOf(this) }
}
```

`single` / `factory` / `scoped` are lifetimes. `by inject()` is the locator again, with nicer syntax and a `LifeCycleOwner` hook. A missing binding shows up when the screen opens, not when the project compiles. Constructors are not auto-wired unless you write the `get()` yourself.

## What to actually ship

- **Constructors**: presenters, stores, and use cases.
- **One graph at the Activity / Application edge**: handwritten, Hilt, or Koin.
- **Hilt**: when a missing binding should fail CI.
- **Koin**: when the team wants a module DSL and will catch misses in tests.
- **No framework**: when `SessionGraph.presenter(view)` still fits on one screen.

Injection is the technique. The library is optional.
