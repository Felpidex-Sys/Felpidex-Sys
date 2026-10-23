# Digital World Offline Mobile (branch de laboratório)

Esta branch contém o **código-fonte do protótipo Android** em [dmo-mobile-source.zip](./dmo-mobile-source.zip). A branch `main` do perfil permanece intacta.

O pacote ZIP contém um projeto Godot 4.4.1, com ambiente 3D, controles por toque, companheiro, combate, evolução, missão e salvamento offline em JSON. **Não contém arquivos ou modelos originais do Digimon Masters Online.**

## Compilar APK

Abra **Actions → DMO Mobile Android APK → Run workflow**, selecionando `dmo-mobile-lab`. Depois de um build bem-sucedido, baixe o artifact `digital-world-offline-debug-apk`.

Caso o Actions falhe, baixe o ZIP, abra em Godot 4.4.1 e consulte o README interno e o log de erro. APK não foi validado em aparelho real.

Modelos originais autorizados, convertidos para .glb, devem ficar somente em `assets/user_models` da cópia local e não ser commitados ao GitHub.
