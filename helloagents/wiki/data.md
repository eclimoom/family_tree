# 数据模型

## 族谱(Genealogy)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 族谱唯一标识 |
| name | string | 族谱名称 |
| members | Person[] | 成员列表 |

## 成员(Person)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 人员唯一标识 |
| name | string | 姓名 |
| gender | string | 性别: 男/女/未知 |
| birthDate | string | 出生日期 |
| deathDate | string | 去世日期，可为空 |
| birthAddress | string | 出生地 |
| livingAddress | string | 现住址 |
| spouse | string | 配偶 id |
| coupleId | string | 夫妻组 id |
| generation | number | 代系 |
