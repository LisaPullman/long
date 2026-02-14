#!/usr/bin/env bash
set -euo pipefail

BASE=${BASE:-http://localhost:3001/api}
USER_ID=${USER_ID:-demo-user-001}
DEMO_PHONE=${DEMO_PHONE:-13800138000}
DEMO_PASSWORD=${DEMO_PASSWORD:-demo123456}

json() {
  # Usage: json <node expression that prints something>
  node -e "const fs=require('fs'); const o=JSON.parse(fs.readFileSync(0,'utf8')); ${1}" 
}

log() { printf "\n==> %s\n" "$*"; }

log "1) Check services"
curl -fsS "$BASE" >/dev/null

log "1.5) Login (JWT)"
LOGIN_JSON=$(curl -fsS -X POST "$BASE/users/login" -H 'Content-Type: application/json' -d "{\"phone\":\"$DEMO_PHONE\",\"password\":\"$DEMO_PASSWORD\"}")
TOKEN=$(printf '%s' "$LOGIN_JSON" | node -e "const fs=require('fs'); const o=JSON.parse(fs.readFileSync(0,'utf8')); console.log(o.token||'');")
if [ -z "$TOKEN" ]; then
  echo "Login failed: $LOGIN_JSON" >&2
  exit 3
fi
AUTH=(-H "Authorization: Bearer $TOKEN")

auth_user_id="$USER_ID"

log "2) Fetch default shipping address for userId=$auth_user_id"
ADDR_JSON=$(curl -fsS "${AUTH[@]}" "$BASE/users/$auth_user_id/addresses")
DEFAULT_ADDR=$(printf '%s' "$ADDR_JSON" | node -e "const fs=require('fs'); const arr=JSON.parse(fs.readFileSync(0,'utf8')); const a=arr.find(x=>x.isDefault)||arr[0]; if(!a){process.exit(2)}; console.log(JSON.stringify(a));")
RECEIVER_NAME=$(printf '%s' "$DEFAULT_ADDR" | json "console.log(o.receiverName)")
RECEIVER_PHONE=$(printf '%s' "$DEFAULT_ADDR" | json "console.log(o.receiverPhone)")
PROVINCE=$(printf '%s' "$DEFAULT_ADDR" | json "console.log(o.province)")
CITY=$(printf '%s' "$DEFAULT_ADDR" | json "console.log(o.city)")
DISTRICT=$(printf '%s' "$DEFAULT_ADDR" | json "console.log(o.district)")
DETAIL_ADDRESS=$(printf '%s' "$DEFAULT_ADDR" | json "console.log(o.detailAddress)")

log "3) Create a new Mart (with image URLs and goods)"
FINISH_TIME=$(node -e "console.log(new Date(Date.now()+7*24*60*60*1000).toISOString())")
MART_PAYLOAD=$(cat <<JSON
{
  "topic": "【模拟】周末水果接龙",
  "description": "用于本地联调的模拟接龙：支持图片URL、商品、下单。",
  "setFinishTime": true,
  "finishTime": "${FINISH_TIME}",
  "deliveryDescription": "统一配送，预计 2-3 天内发货",
  "expectedShipDays": 3,
  "autoConfirmDays": 7,
  "images": [
    {"imageUrl": "https://picsum.photos/seed/mock-mart-1/1200/800"},
    {"imageUrl": "https://picsum.photos/seed/mock-mart-2/1200/800"}
  ],
  "goods": [
    {
      "name": "【模拟】红富士苹果",
      "description": "脆甜多汁，5斤装",
      "specification": "5斤/箱",
      "price": 29.9,
      "originalPrice": 39.9,
      "repertory": 20,
      "purchaseLimit": 3,
      "lowStockThreshold": 5,
      "cost": 15,
      "laborCost": 2,
      "packagingCost": 3,
      "sortOrder": 0,
      "images": [{"imageUrl": "https://picsum.photos/seed/mock-goods-apple/600/600"}]
    },
    {
      "name": "【模拟】赣南脐橙",
      "description": "酸甜适口，10斤装",
      "specification": "10斤/箱",
      "price": 39.9,
      "originalPrice": 49.9,
      "repertory": 15,
      "purchaseLimit": 2,
      "lowStockThreshold": 5,
      "cost": 20,
      "laborCost": 2,
      "packagingCost": 3,
      "sortOrder": 1,
      "images": [{"imageUrl": "https://picsum.photos/seed/mock-goods-orange/600/600"}]
    }
  ]
}
JSON
)
MART_JSON=$(curl -fsS "${AUTH[@]}" -X POST "$BASE/marts" -H 'Content-Type: application/json' -d "$MART_PAYLOAD")
MART_ID=$(printf '%s' "$MART_JSON" | json "console.log(o.id)")
GOODS1_ID=$(printf '%s' "$MART_JSON" | json "console.log(o.goods[0].id)")
GOODS2_ID=$(printf '%s' "$MART_JSON" | json "console.log(o.goods[1].id)")
printf "MartId=%s\nGoodsIds=%s,%s\n" "$MART_ID" "$GOODS1_ID" "$GOODS2_ID"

log "4) Create an Order for this Mart"
ORDER_PAYLOAD=$(cat <<JSON
{
  "martId": "${MART_ID}",
  "receiverName": "${RECEIVER_NAME}",
  "receiverPhone": "${RECEIVER_PHONE}",
  "province": "${PROVINCE}",
  "city": "${CITY}",
  "district": "${DISTRICT}",
  "detailAddress": "${DETAIL_ADDRESS}",
  "buyerRemark": "【模拟】请尽快发货",
  "items": [
    {"goodsId": "${GOODS1_ID}", "quantity": 2},
    {"goodsId": "${GOODS2_ID}", "quantity": 1}
  ]
}
JSON
)
ORDER_JSON=$(curl -fsS "${AUTH[@]}" -X POST "$BASE/orders" -H 'Content-Type: application/json' -d "$ORDER_PAYLOAD")
ORDER_ID=$(printf '%s' "$ORDER_JSON" | json "console.log(o.id)")
ORDER_NO=$(printf '%s' "$ORDER_JSON" | json "console.log(o.orderNo)")
ORDER_STATUS=$(printf '%s' "$ORDER_JSON" | json "console.log(o.status)")
printf "OrderId=%s OrderNo=%s Status=%s\n" "$ORDER_ID" "$ORDER_NO" "$ORDER_STATUS"

log "5) Close and End Mart (CREATED orders -> PENDING_SHIPMENT)"
curl -fsS "${AUTH[@]}" -X POST "$BASE/marts/$MART_ID/close" >/dev/null
curl -fsS "${AUTH[@]}" -X POST "$BASE/marts/$MART_ID/end" >/dev/null
ORDER_AFTER_END=$(curl -fsS "${AUTH[@]}" "$BASE/orders/$ORDER_ID")
ORDER_STATUS_AFTER_END=$(printf '%s' "$ORDER_AFTER_END" | json "console.log(o.status)")
printf "OrderStatusAfterEnd=%s\n" "$ORDER_STATUS_AFTER_END"

log "6) Update order status: SHIPPED -> DELIVERED -> COMPLETED"
PATCH() {
  curl -fsS "${AUTH[@]}" -X PATCH "$BASE/orders/$ORDER_ID/status" -H 'Content-Type: application/json' -d "$1" >/dev/null
}
PATCH '{"status":"SHIPPED","shippingCompany":"SF Express","shippingNo":"SF123456789"}'
PATCH '{"status":"DELIVERED"}'
PATCH '{"status":"COMPLETED"}'
FINAL_ORDER=$(curl -fsS "${AUTH[@]}" "$BASE/orders/$ORDER_ID")
FINAL_STATUS=$(printf '%s' "$FINAL_ORDER" | json "console.log(o.status)")
printf "FinalOrderStatus=%s\n" "$FINAL_STATUS"

log "7) (Optional) Send a message"
MSG_JSON=$(curl -fsS "${AUTH[@]}" -X POST "$BASE/messages" -H 'Content-Type: application/json' -d "{\"title\":\"【模拟】订单已完成\",\"content\":\"订单 $ORDER_NO 已完成，感谢使用 VanMart\",\"type\":\"order\",\"relatedId\":\"$ORDER_ID\"}")
MSG_ID=$(printf '%s' "$MSG_JSON" | json "console.log(o.id)")
printf "MessageId=%s\n" "$MSG_ID"

log "8) Stats checks"
MART_SUMMARY=$(curl -fsS "${AUTH[@]}" "$BASE/stats/mart/$MART_ID/summary")
MART_ORDER_TOTAL=$(printf '%s' "$MART_SUMMARY" | json "console.log(o.orders.total)")
USER_STATS=$(curl -fsS "${AUTH[@]}" "$BASE/stats/user/orders")
USER_ORDER_TOTAL=$(printf '%s' "$USER_STATS" | json "console.log(o.total.orderCount)")
printf "MartOrdersTotal=%s UserOrdersTotal=%s\n" "$MART_ORDER_TOTAL" "$USER_ORDER_TOTAL"

log "Done"
printf "\nOpen in browser (order create page): http://localhost:8080/orders/create?martId=%s\n" "$MART_ID"
printf "Open in browser (order detail page): http://localhost:8080/orders/%s\n" "$ORDER_ID"
