
**文档（Document）**

| **请求方法** | **完整 URL**                                                                                                                                                                                          | **功能描述**                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **GET**      | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents)`                              | 获取文档列表（支持 keyword/page/limit 参数）                    |
| **GET**      | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){documentId}`                | 获取文档详情                                                    |
| **POST**     | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/document/create_by_text](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/document/create_by_text)`  | 文本创建文档                                                    |
| **POST**     | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/document/create_by_file](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/document/create_by_file)`  | 文件创建文档（multipart/form-data）                             |
| **POST**     | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){documentId}/update_by_text` | 文本更新/重命名文档                                             |
| **POST**     | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){documentId}/update_by_file` | 文件更新文档（multipart/form-data）                             |
| **GET**      | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){batch}/indexing-status`     | 查询文档索引进度                                                |
| **GET**      | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){documentId}/download`       | 下载原文件                                                      |
| **PATCH**    | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/status/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/status/){action}`      | 批量修改文档状态（action 为 enable/disable/archive/un_archive） |
| **DELETE**   | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){documentId}`                | 删除文档                                                        |

**元数据字段（Metadata）**

| **请求方法** | **完整 URL**                                                                                                                                                                                       | **功能描述**                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **GET**      | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata)`                             | 获取元数据字段列表                                  |
| **POST**     | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata)`                             | 新增元数据字段                                      |
| **PATCH**    | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata/){metadataId}`               | 重命名元数据字段                                    |
| **DELETE**   | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata/){metadataId}`               | 删除元数据字段                                      |
| **POST**     | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata/built-in/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata/built-in/){action}` | 启用/关闭内置元数据字段（action 为 enable/disable） |
| **GET**      | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata/built-in](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/metadata/built-in)`           | 获取系统内置元数据字段                              |

**文档元数据标注（Document Metadata）**

| **请求方法** | **完整 URL**                                                                                                                                                                               | **功能描述**                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| **POST**     | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/metadata](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/metadata)` | 批量更新文档元数据（Body 传输`operation_data`） |

**分段（Segments）**

| **请求方法** | **完整 URL**                                                                                                                                                                                                | **功能描述**      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **GET**      | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){documentId}/segments`             | 获取分段列表            |
| **POST**     | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){documentId}/segments`             | 添加/批量添加分段       |
| **POST**     | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){documentId}/segments/{segmentId}` | 更新分段/开启或停用分段 |
| **DELETE**   | `[https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/](https://multiapi.ahnw.cc/v1/datasets/e8e122ca-e3c2-4685-8062-fb0ff8fb91a1/documents/){documentId}/segments/{segmentId}` | 删除分段                |
