import type { SearchResult } from '../../electron.d'
import './SearchResults.css'

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onFileSelect: (filePath: string, fileName: string) => void
}

/**
 * 将匹配行拆成三段渲染，避免 dangerouslySetInnerHTML
 */
function HighlightLine({
  lineText,
  matchStart,
  matchEnd,
}: {
  lineText: string
  matchStart: number
  matchEnd: number
}): React.ReactElement {
  const before = lineText.slice(0, matchStart)
  const match = lineText.slice(matchStart, matchEnd)
  const after = lineText.slice(matchEnd)
  return (
    <>
      {before}
      <mark>{match}</mark>
      {after}
    </>
  )
}

/**
 * 去掉 .md 后缀显示文件名
 */
function displayName(fileName: string): string {
  return fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName
}

function SearchResults({ results, query, onFileSelect }: SearchResultsProps): React.ReactElement {
  if (query.trim() && results.length === 0) {
    return (
      <div className="search-results-empty">
        无匹配结果
      </div>
    )
  }

  return (
    <div className="search-results">
      {results.map((group) => (
        <div key={group.filePath} className="search-result-group">
          <div className="search-result-file">{displayName(group.fileName)}</div>
          {group.matches.map((match) => (
            <div
              key={`${group.filePath}-${match.lineNumber}`}
              className="search-result-match"
              onClick={() => onFileSelect(group.filePath, group.fileName)}
              title={`${group.fileName} 第${match.lineNumber}行`}
            >
              <span className="search-result-lineno">第{match.lineNumber}行：</span>
              <HighlightLine
                lineText={match.lineText}
                matchStart={match.matchStart}
                matchEnd={match.matchEnd}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default SearchResults
