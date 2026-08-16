---
title: "Share the feature layer, keep the views native — and start from a modular app, not a rewrite."
description: "Android and iOS each come with types that do not travel. Kotlin Multiplatform holds up when you leave those couplings at the edge, pick a migration shape that matches the product, and give Swift an API it already knows how to subscribe to."
banner: "/assets/blogs/kotlin-multiplatform-architecture/banner.jpg"
---

## What actually has to be shared

A Kotlin-first Android app does not become multiplatform by renaming a module to `commonMain`. LiveData, AndroidX ViewModel, Combine, and UIKit each assume the platform they were built for. Those couplings belong at the edge. What you want in shared code is the feature: intents in, state out, repositories underneath.

The rest of this post is the conversion order I use: modularize, pick a migration shape, wrap existing repos, then give both UIs a ViewModel they can hold without importing each other’s types.

## Modularize before you multiplatform

Migrate one module at a time. That only works if the graph is already cut into boxes.

What “ready” looks like:

- **Unidirectional features**: screens speak in actions and state, not in `Activity` or `UIViewController` callbacks.
- **Inversion of control**: a Login feature does not construct its auth client and user store by hand. Inject them.
- **Platform types stop at two places**: the View, and the Repo (or the data source behind it).
- **LiveData in the feature layer is a blocker**: it is an Android type. If the feature observes through it, that layer is not portable yet.

Think of the app as a stack: network and database at the bottom, repositories in the middle, features above them, the app shell at the top. Modularization is making those layers real Gradle (and later Xcode) modules before any of them move into a multiplatform source set.

## Pick the path from the product

Once the graph is modular, the conversion path depends on what you ship.

### One app, two platforms

Every feature has to exist on Android and iOS. You can start anywhere. Treat it like a new app: replicate the behavior, then push shared pieces down into common code. There is no unused corner to hide the first experiment.

### Several different apps

Stay close to the modularization work itself. Convert as you extract. Pick one feature. Start at the bottom of that feature — API, then storage, then the repo, then the feature — so each PR still ships.

### Several similar apps

You have more than one lever, and the right one depends on the existing architecture and the teams:

- **New feature**: the next slice is multiplatform from day one.
- **Vertical**: take one feature all the way through the stack.
- **Horizontal**: share one layer (clients, then repos, then features) across apps.
- **Small PRs**: any of these can be a sequence of small pull requests. That is how the conversion stays on the release train.

## Wrap the repo you already have

A new shared feature does not need a new user store. It needs a common contract that both existing implementations can satisfy.

```kotlin
expect interface UserRepository {
    suspend fun getUser(): User
    suspend fun updateUser(user: User): User
}
```

On each platform, `actual` can be a typealias onto code that already ships:

```kotlin
// Android
actual typealias UserRepository = com.example.android.data.UserRepository

// iOS
actual typealias UserRepository = com.example.ios.data.UserRepository
```

You are not rewriting the repo. You are giving common code a name it can compile against, then wiring the platform type underneath.

## Vertical vs horizontal

Vertical walks one column: auth client, then database, then user repo, then Login, until that feature is shared and the rest of the app is still native. That is how you prove the full stack for one user journey.

Horizontal walks one row: share the network clients across apps, then the repos, then lift a feature once its dependencies already live in common. That is how you amortize infrastructure before you touch UI.

Similar apps can use either. Different apps almost always start from the bottom of one feature.

## The feature layer sits between two native ends

A shared Login feature talks in two directions:

- **To repositories (or use cases)**: data in, domain out.
- **To views**: platform UI that you are not sharing.

Views stay native. Repositories may already be `expect`/`actual`. The remaining question is observation: how the view sees values, and how it sends work back.

Keep that contract unidirectional:

- **ViewAction**: the view fires intents (login tapped, date selected).
- **ViewState**: the feature reduces those actions plus repo streams into something the view can render.

Android already has types for this. iOS does not want LiveData. The shared feature needs a reactive surface both sides can subscribe to.

## Give Swift a subscribe API, not a Flow collector

Common code can stay on `StateFlow`. Android collects it. iOS should not. Expose a callback-shaped subscribe that returns something disposable.

```kotlin
fun interface Disposable {
    fun dispose()
}

expect interface ViewModel<State : Any> {
    val state: StateFlow<State>
}

fun <T : Any> StateFlow<T>.watch(onEach: (T) -> Unit): Disposable {
    val job = CoroutineScope(SupervisorJob() + Dispatchers.Main).launch {
        collect { onEach(it) }
    }
    return Disposable { job.cancel() }
}
```

```kotlin
// Android — collect the flow directly
actual interface ViewModel<State : Any> {
    actual val state: StateFlow<State>
}

// iOS — extra function so UIKit never sees collect
actual interface ViewModel<State : Any> {
    actual val state: StateFlow<State>
    fun watchState(onEach: (State) -> Unit): Disposable = state.watch(onEach)
}
```

On the Swift side the screen stays a view controller. It does not import Android types.

```swift
final class LoginViewController: UIViewController {
    private var watch: Disposable?

    override func viewDidLoad() {
        super.viewDidLoad()
        watch = viewModel.watchState { [weak self] state in
            self?.render(state)
        }
    }

    deinit {
        watch?.dispose()
    }
}
```

Callbacks beat leaking a Kotlin `Flow` collector into UIKit. If the iOS team already lives in Combine, wrap `watch` once behind a `Publisher` and stop there. Do not ask every screen to learn structured concurrency in Kotlin.

## A shared ViewModel that both platforms can hold

The feature’s shared brain is that `ViewModel`. It reduces repository streams into one state object. Login is the usual first candidate: session, profile, and an error line.

```kotlin
class LoginViewModel(
    private val auth: AuthRepository,
    private val users: UserRepository
) : ViewModel<LoginViewState> {
    private val email = MutableStateFlow("")
    private val submitting = MutableStateFlow(false)

    override val state: StateFlow<LoginViewState> = combine(
        email,
        submitting,
        users.currentUser()
    ) { email, submitting, user ->
        LoginViewState(
            email = email,
            isSubmitting = submitting,
            isSignedIn = user != null
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = LoginViewState()
    )

    fun onEmailChanged(value: String) {
        email.value = value
    }

    fun onSubmit() {
        // viewModelScope.launch { auth.signIn(email.value) }
    }
}
```

Shared logic, native view, disposable subscription. That is the whole feature-layer contract.

## What to take into a real migration

- **Modularize before you multiplatform**: one module at a time is the only conversion that survives a release schedule.
- **Limit platform types to View and Repo**: LiveData in the feature layer is a conversion blocker.
- **Pick the path from the product**: single app: start anywhere, replicate. Different apps: bottom-up per feature. Similar apps: new feature, vertical, or horizontal — in small PRs.
- **expect / actual**: wrap the repo you already have. Typealias onto it.
- **Views stay native**: share actions, state, and the ViewModel that reduces them.
- **Give iOS an API it already knows**: `watch` / `dispose`, or a Combine `Publisher`, will get further than asking Swift to collect a `Flow`.

The libraries change — `StateFlow`, SKIE, or KMP-NativeCoroutines if you want generated Swift. The architecture does not. Isolate the platform, share the feature, and migrate in the shape of the product you actually ship.
