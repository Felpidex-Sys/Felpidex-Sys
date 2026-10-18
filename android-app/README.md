# Entre Notas & Girassóis — versão APK Android

Este projeto empacota a versão mobile em WebView nativo, com todos os arquivos do jogo embutidos para funcionar sem internet.

Execute `gradle -p android-app :app:assembleDebug` com JDK 17 e Android SDK 35; ou consulte a aba Actions deste repositório. O APK de testes fica em `android-app/app/build/outputs/apk/debug/app-debug.apk`.

O progresso é salvo localmente no aplicativo. Ao desinstalar ou limpar os dados do app, o progresso pode ser perdido. Como a primeira versão é assinada com uma chave de depuração, atualizações compiladas com outra chave podem exigir desinstalação.
