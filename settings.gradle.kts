pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        // Google / Android
        google()

        // Maven Central (Ktor, etc.)
        mavenCentral()

        // JitPack para Supabase
        maven { url = uri("https://jitpack.io") }

        // Repositorio oficial de Jiguang (JPush)
        maven { url = uri("https://maven.aliyun.com/repository/jcenter") }
        maven { url = uri("https://maven.aliyun.com/repository/public") }
    }
}

rootProject.name = "Message App"
include(":app")
