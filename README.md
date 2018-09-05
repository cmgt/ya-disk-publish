# ya-disk-publish
Yandex.Disk publish MSBuild Task
# Расширение TFS/VSTS для публикации объектов в облако Yandex.Disk
MSBuild задача **Yandex.Disk Publish Task** для публикации в облако Yandex.Disk создана аналогично задачам CopyFile/DeleteFile  
Для использования необходимо заполнить параметры:  
Contents - перечень объектов для публикации  
Source path - путь к каталогу для поиска объектов публикации  
Yandex.Disk destination path - путь к каталогу Yandex.Disk (например, test/test)  
OAuth Token - токен аутентификации задачи публикации для целевого аккаунта Yandex.Disk  
## Получение OAuth Token Yandex.Disk
Для получения токена необходимо перейти по ссылке https://oauth.yandex.ru/authorize?response_type=token&client_id=6a5e12a08a6544448b257078a9eaef10  
Авторизоваться в своем аккаунте Yandex.Disk и предоставить приложению указанные права. После этого произойдет переход на страницу токена
# Страница расширения на marketplace.visualstudio.com
https://marketplace.visualstudio.com/items?itemName=DenisPorotikov.yandex-disk-publish-build-release-task
