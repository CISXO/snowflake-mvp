"use client"

import { useState, useEffect } from "react"

type User = { _id: string; name: string; email: string }

export default function TestPage() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  async function fetchUsers() {
    const res = await fetch("/api/users")
    setUsers(await res.json())
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleCreate() {
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    })
    setName("")
    setEmail("")
    fetchUsers()
  }

  async function handleUpdate(id: string) {
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    })
    setEditingId(null)
    setName("")
    setEmail("")
    fetchUsers()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/users/${id}`, { method: "DELETE" })
    fetchUsers()
  }

  function startEdit(user: User) {
    setEditingId(user._id)
    setName(user.name)
    setEmail(user.email)
  }

  return (
    <main className="min-h-screen p-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">User CRUD 테스트</h1>

      {/* 생성 / 수정 폼 */}
      <section className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-3">
          {editingId ? "수정" : "생성"}
        </h2>
        <div className="flex flex-col gap-2 mb-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className="border px-3 py-2 rounded"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="border px-3 py-2 rounded"
          />
        </div>
        <div className="flex gap-2">
          {editingId ? (
            <>
              <button
                onClick={() => handleUpdate(editingId)}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                수정 저장
              </button>
              <button
                onClick={() => { setEditingId(null); setName(""); setEmail("") }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                취소
              </button>
            </>
          ) : (
            <button
              onClick={handleCreate}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              생성
            </button>
          )}
        </div>
      </section>

      {/* 유저 목록 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">유저 목록 ({users.length}명)</h2>
        {users.length === 0 ? (
          <p className="text-gray-400">유저가 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {users.map((u) => (
              <li key={u._id} className="flex items-center justify-between border p-3 rounded">
                <span>
                  <span className="font-medium">{u.name}</span>{" "}
                  <span className="text-gray-500 text-sm">{u.email}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(u)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded text-sm hover:bg-yellow-500"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}