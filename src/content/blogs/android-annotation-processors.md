---
title: "Scan annotations at compile time, fail the build when the contract is wrong, and generate the boilerplate you would rather not type."
description: "Room and Dagger are annotation processors. The same javac hook can validate a singleton, or write a Java file for you, without reflection and without shipping the annotation in the APK."
banner: "/assets/blogs/android-annotation-processors/banner.jpg"
---

## Annotations vs processors

An annotation is syntactic metadata on a class, method, field, or parameter. `@Override` and `@Nullable` are the ones you already type without thinking.

An annotation processor is a compiler plugin. During `javac` (or kapt / KSP in a Kotlin module) it:

- **Scans** source for the annotations it cares about
- **Reports** notes, warnings, and errors on those elements
- **Writes** new source files that the next compilation round will compile

Room’s `@Entity` and Dagger’s `@Module` are this machinery. The interesting part is that you can register your own.

## Why compile time, not runtime

Reflection can read annotations after the app starts. That is late, slow, and easy to get wrong on a minified build.

A processor runs while the project is still compiling:

- **The build fails** if a class marked as a single instance still has a public constructor
- **There is no reflection** in the generated path
- **Boilerplate is generated** — factories, bindings, `getInstance()` holders — so the handwritten code stays small

Keep the annotation at `RetentionPolicy.SOURCE` unless a runtime library actually needs to see it. Source retention means the marker never lands in the dex file.

## How the compiler invokes you

Three pieces, in order.

- **apt**: part of `javac`. It finds annotations in the current round of source and calls every registered processor that claims them.
- **The Mirror API**: `javax.lang.model`. It describes the program at the language level (types, elements, modifiers), not at the VM level. It is read-only. You inspect; you do not mutate the tree in place.
- **Rounds**: if your processor writes a new `.java` file, javac compiles that file and runs processors again. The loop ends when a round produces no new types. Errors you print with `Messager` fail the build like any other compile error.

Kotlin-only modules today often use KSP instead of kapt. The idea is the same: a processor, a round environment, generated source. The rest of this post uses `AbstractProcessor` because that is still the API Android Java (and kapt) speak.

## Start with an annotation

A single-instance helper is a good first contract: private constructor, static accessor, same return type as the class.

```java
@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.TYPE)
public @interface SingleInstance {}
```

Usage stays ordinary:

```java
@SingleInstance
public final class LocationClient {
    private static final LocationClient INSTANCE = new LocationClient();

    private LocationClient() {}

    public static LocationClient get() {
        return INSTANCE;
    }
}
```

The processor’s job is to refuse anything that claims `@SingleInstance` and then breaks that shape.

## `AbstractProcessor` is four methods

```java
public final class SingleInstanceProcessor extends AbstractProcessor {
    private Messager messager;
    private Filer filer;
    private Elements elements;
    private Types types;

    @Override
    public synchronized void init(ProcessingEnvironment env) {
        super.init(env);
        messager = env.getMessager();
        filer = env.getFiler();
        elements = env.getElementUtils();
        types = env.getTypeUtils();
    }

    @Override
    public Set<String> getSupportedAnnotationTypes() {
        return Set.of(SingleInstance.class.getCanonicalName());
    }

    @Override
    public SourceVersion getSupportedSourceVersion() {
        return SourceVersion.latestSupported();
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment round) {
        for (TypeElement type : ElementFilter.typesIn(
                round.getElementsAnnotatedWith(SingleInstance.class))) {
            if (!constructorsArePrivate(type)) return true;
            if (!hasStaticAccessor(type)) return true;
        }
        return true;
    }
}
```

`init` is where you stash the environment utilities. `process` is where the work happens. Returning `true` tells javac you claimed those annotations so another processor should not also try to handle them.

### Private constructors

```java
private boolean constructorsArePrivate(TypeElement type) {
    for (ExecutableElement constructor : ElementFilter.constructorsIn(type.getEnclosedElements())) {
        if (!constructor.getModifiers().contains(Modifier.PRIVATE)) {
            messager.printMessage(
                    Diagnostic.Kind.ERROR,
                    "A @SingleInstance type must keep every constructor private",
                    constructor
            );
            return false;
        }
    }
    return true;
}
```

Package-private counts as not private. The error is anchored on the constructor element so the IDE underline lands on the right line.

### A static accessor that returns the type

```java
private boolean hasStaticAccessor(TypeElement type) {
    for (ExecutableElement method : ElementFilter.methodsIn(type.getEnclosedElements())) {
        if (!method.getSimpleName().contentEquals("get")) continue;
        if (!types.isSameType(method.getReturnType(), type.asType())) continue;

        if (method.getModifiers().contains(Modifier.PRIVATE)) {
            messager.printMessage(
                    Diagnostic.Kind.ERROR,
                    "get() cannot be private on a @SingleInstance type",
                    method
            );
            return false;
        }
        if (!method.getModifiers().contains(Modifier.STATIC)) {
            messager.printMessage(
                    Diagnostic.Kind.ERROR,
                    "get() must be static on a @SingleInstance type",
                    method
            );
            return false;
        }
        return true;
    }

    messager.printMessage(
            Diagnostic.Kind.ERROR,
            "A @SingleInstance type needs a static get() that returns the type itself",
            type
    );
    return false;
}
```

You are walking `Element`s, not Class objects. That is the Mirror API: `TypeElement` for the class, `ExecutableElement` for constructors and methods, `Types.isSameType` for the return type.

## Register the processor

The compiler only runs processors it can load from `META-INF/services/javax.annotation.processing.Processor`.

Hand-writing that file is the old path. AutoService generates it:

```java
@AutoService(Processor.class)
public final class SingleInstanceProcessor extends AbstractProcessor {
    // …
}
```

Put the processor in a Java module the app depends on as `annotationProcessor` (or `kapt`). The annotation itself can live in a smaller `compileOnly` module so app code can mention `@SingleInstance` without pulling the processor onto the runtime classpath.

## Generate source with JavaPoet

Validation is half of the job. The other half is writing a file. JavaPoet builds a `JavaFile` you send through `Filer`.

```java
MethodSpec main = MethodSpec.methodBuilder("main")
        .addModifiers(Modifier.PUBLIC, Modifier.STATIC)
        .returns(void.class)
        .addParameter(String[].class, "args")
        .addStatement("$T.out.println($S)", System.class, "generated")
        .build();

TypeSpec hello = TypeSpec.classBuilder("GeneratedWelcome")
        .addModifiers(Modifier.PUBLIC, Modifier.FINAL)
        .addMethod(main)
        .build();

JavaFile.builder("com.example.generated", hello)
        .build()
        .writeTo(filer);
```

`$T` and `$S` are the placeholders that keep imports and string escaping honest. In a real processor you would derive the package and type name from the annotated `TypeElement`, then `writeTo(filer)` so the next round compiles the result. Writing to `System.out` is only for debugging the spec.

The same pattern is how view-binding libraries turn `@BindView` / `@OnClick` into a class that assigns fields and sets click listeners. You would scan methods, emit a binder type, and keep the Activity as a few annotated members.

## What to keep in the module graph

- **Annotation module**: the `@interface`, `SOURCE` retention, no processor code.
- **Processor module**: `AbstractProcessor`, AutoService, JavaPoet. Java, even if the app is Kotlin.
- **App module**: `compileOnly` the annotation, `annotationProcessor` / `kapt` the processor.

Never ship the processor in the APK. Never read `@SingleInstance` with reflection at runtime if retention is `SOURCE` — there will be nothing to find.

KSP is the better default for new Kotlin processors. If you already have a Java processor and a mixed app, `AbstractProcessor` plus kapt is still the conversion that does not require a rewrite.

## Checklist

- **Claim types explicitly** in `getSupportedAnnotationTypes()`. A wildcard processor that runs on every type is a compile-time tax.
- **Anchor errors on the element**. `printMessage(kind, msg, element)` is what makes the red underline useful.
- **Return `true` from `process`** when you handled the annotation set.
- **Expect extra rounds** after you write files. Idempotent `process` implementations survive that.
- **Generate with JavaPoet (or KotlinPoet)**. String-concatenated source breaks on the first nested class.
