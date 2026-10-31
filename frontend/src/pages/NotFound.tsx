import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section>
      <h1>Not found</h1>
      <p>
        <Link to="/">Go home</Link>
      </p>
    </section>
  )
}
