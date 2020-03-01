class Atom
  attr_reader :bytes

  TYPE_LENGTH = 4
  SIZE_LENGTH = 4
  HEADER_LENGTH = TYPE_LENGTH + SIZE_LENGTH

  def initialize(bytes)
    raise unless bytes.is_a?(Bytes)
    @bytes = bytes
  end

  def number_of_bytes_required
    if has_children?
      999999999 # TODO 未実装
    else
      (HEADER_LENGTH + size) - bytes.size
    end
  end

  def complete?
    number_of_bytes_required == 0
  end

  def type
    bytes.first(4).to_s
  end

  def has_children?
    # 先頭1ビットは子供Atomが存在するかどうかを示す
    (size_range & 0x80000000) != 0
  end

  def size
    # 2ビット目以降は、1ビット目によって意味が変わる
    # 先頭1ビットが1の場合：子供Atomの数
    # 先頭1ビットが0の場合：データの長さ(byte)
    size_range & 0x7FFFFFF
  end

  def children
    return [] unless has_children?

    current_atom = self
    size.times.map do
      current_atom = current_atom.next
    end
  end

  def data
    bytes.substring(8, size)
  end

  def next
    if has_children?
      Atom.new(bytes.substring(8))
      # TODO: childrenをスキップしたい
    else
      Atom.new(bytes.substring(8 + size))
    end
  end

  private

  def size_range
    bytes.substring(4, 4).to_i
  end
end
