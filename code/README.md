# token-bridge
An AWS Subgraph bridge to connect EVMs

## Adding a new recieved TX

The AWS service will monitory the `Bridge` contract for 

| ID | DepositTXID | Account | Amount | ChainID | Data | Nonce | Timestamp | 
|---|---|---|---|---|---|---|---|
| 0 | 0x0000 | 0x0000000000000000000000000000000000000000 | 20 | BNC |
| 1 | 0x0001 | 0x0000000000000000000000000000000000000000 | 30 | BNC |
| 2 | 0x0002 | 0x0000000000000000000000000000000000000000 | 100 | BNC |

## Process with retry

See https://halodao.atlassian.net/wiki/spaces/HALODAO/pages/42303489/EVM+Bridge

## Bridge notes

The amount held on the primary bridge:  token(n1, ....nm) = total token supply of secondary chain(1, ...m)
